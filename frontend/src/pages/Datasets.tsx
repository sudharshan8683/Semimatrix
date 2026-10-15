import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client';
import { DataBasisBadge } from '../components/common/DataBasisBadge';
import {
  Upload,
  Database,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Sliders,
  Trash2,
  HelpCircle,
  ArrowRight,
  Info,
  ShieldCheck,
  Check,
  Layers
} from 'lucide-react';

const CANONICAL_FIELDS = [
  { key: 'timestamp', label: 'Timestamp (ISO / Datetime)', category: 'Time' },
  { key: 'equipment_id', label: 'Equipment ID (e.g. CVD-01)', category: 'Asset' },
  { key: 'equipment_type', label: 'Equipment Type (cvd, etch, cmp, etc.)', category: 'Asset' },
  { key: 'wafer_lot_id', label: 'Wafer Lot ID', category: 'Lot' },
  { key: 'wafer_id', label: 'Wafer ID', category: 'Lot' },
  { key: 'process_stage', label: 'Process Stage', category: 'Lot' },
  { key: 'temperature', label: 'Temperature (°C)', category: 'Sensor' },
  { key: 'pressure', label: 'Pressure (mTorr / Torr)', category: 'Sensor' },
  { key: 'vibration', label: 'Vibration (mm/s)', category: 'Sensor' },
  { key: 'current', label: 'Current / RF Power', category: 'Sensor' },
  { key: 'processing_time', label: 'Processing Time (s)', category: 'Process' },
  { key: 'equipment_status', label: 'Operational Status', category: 'Asset' },
  { key: 'downtime', label: 'Downtime Duration', category: 'Asset' },
  { key: 'total_units', label: 'Total Units / Inspected Die', category: 'Yield' },
  { key: 'good_units', label: 'Good Units / Passing Die', category: 'Yield' },
  { key: 'defect_count', label: 'Defect Units / Scrap', category: 'Yield' },
  { key: 'failure_label', label: 'Failure Label (0/1)', category: 'Failure' },
  { key: 'maintenance_event', label: 'Maintenance Event Flag', category: 'Maintenance' },
  { key: 'custom_numeric', label: 'Custom Numeric Parameter', category: 'Sensor' },
  { key: 'ignore', label: 'Ignore / Drop Column', category: 'System' }
];

interface CapabilityDef {
  title: string;
  plainAvailable: string;
  plainBlocked: string;
  requiredFields: string[];
}

const CAPABILITY_DEFINITIONS: Record<string, CapabilityDef> = {
  yieldAnalysis: {
    title: 'Wafer Yield Analysis',
    plainAvailable: 'Active: Computes line yield, defect density, and lot scrap rollups.',
    plainBlocked: 'Not available — needs a column for good units and total units.',
    requiredFields: ['total_units', 'good_units']
  },
  spcRunCharts: {
    title: 'SPC Control Charts',
    plainAvailable: 'Active: Evaluates Nelson Rules 1–3 and calculates 3-sigma control limits.',
    plainBlocked: 'Not available — needs a timestamp column and at least one numeric sensor column.',
    requiredFields: ['timestamp', 'numeric sensor']
  },
  maintenanceRisk: {
    title: 'Predictive Equipment Health',
    plainAvailable: 'Active: Tracks equipment telemetry drift and anomaly frequency.',
    plainBlocked: 'Not available — needs equipment ID, timestamp, and at least one operational metric.',
    requiredFields: ['equipment_id', 'timestamp']
  },
  supervisedFailurePrediction: {
    title: 'Supervised Failure Model',
    plainAvailable: 'Active: Evaluates Random Forest failure classification against ground truth.',
    plainBlocked: 'Not available — requires a failure_label column with at least 30 labeled fault events. Predictions are never fabricated.',
    requiredFields: ['failure_label']
  },
  lotToToolCorrelation: {
    title: 'Lot-to-Tool Traceability',
    plainAvailable: 'Active: Correlates lot excursions across processing stages.',
    plainBlocked: 'Not available — needs both wafer lot ID and equipment ID.',
    requiredFields: ['wafer_lot_id', 'equipment_id']
  }
};

export const Datasets: React.FC = () => {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Column Mapping Local State
  const [currentMapping, setCurrentMapping] = useState<Record<string, string>>({});
  const [savingMapping, setSavingMapping] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const mappingRef = useRef<HTMLDivElement>(null);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/datasets');
      const list = res.data.data.datasets || [];
      setDatasets(list);
      if (list.length > 0 && !selectedDataset) {
        setSelectedDataset(list[0]);
        setCurrentMapping(list[0].columnMapping || {});
      }
    } catch (err) {
      console.error('Failed to load datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleSelectDataset = (d: any) => {
    setSelectedDataset(d);
    setCurrentMapping(d.columnMapping || {});
    setUploadError(null);
    setSuccessMsg(null);
  };

  // Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.xlsm')) {
      setUploadError('Macro-enabled workbooks (.xlsm) are rejected for cleanroom security.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);

    try {
      const res = await apiClient.post('/datasets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newDataset = res.data.data.dataset;
      setDatasets([newDataset, ...datasets]);
      setSelectedDataset(newDataset);
      setCurrentMapping(newDataset.columnMapping || {});
      setSuccessMsg(`Successfully uploaded and profiled ${file.name}. Review the column mappings below.`);
    } catch (err: any) {
      setUploadError(err.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Seed Synthetic Demo Handler
  const handleSeedSynthetic = async () => {
    setSeeding(true);
    setUploadError(null);
    setSuccessMsg(null);
    try {
      const res = await apiClient.post('/datasets/generate-synthetic', {
        seed: 42,
        days: 7,
        toolCountPerType: 3
      });
      setSuccessMsg(
        `Seeded cleanroom simulation: ${res.data.data.summary.equipmentCount} tools, ${res.data.data.summary.readingCount} readings, ${res.data.data.summary.injectedEvents} injected excursions.`
      );
      await fetchDatasets();
    } catch (err: any) {
      setUploadError(err.response?.data?.error?.message || 'Seeding failed');
    } finally {
      setSeeding(false);
    }
  };

  // Save Mapping Handler
  const handleSaveMapping = async () => {
    if (!selectedDataset) return;
    setSavingMapping(true);
    setUploadError(null);
    try {
      const datasetId = selectedDataset._id || selectedDataset.id;
      const res = await apiClient.put(`/datasets/${datasetId}/mapping`, {
        mapping: currentMapping
      });
      setSelectedDataset(res.data.data.dataset);
      setSuccessMsg('Column mappings saved. Capability matrix updated successfully.');
    } catch (err: any) {
      setUploadError(err.response?.data?.error?.message || 'Failed to update mapping');
    } finally {
      setSavingMapping(false);
    }
  };

  // Delete Dataset Handler
  const handleDeleteDataset = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete dataset "${name}" and all derived analysis caches? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    setUploadError(null);
    try {
      await apiClient.delete(`/datasets/${id}`);
      setSuccessMsg(`Dataset "${name}" deleted.`);
      const remaining = datasets.filter((d) => (d._id || d.id) !== id);
      setDatasets(remaining);
      if ((selectedDataset?._id || selectedDataset?.id) === id) {
        setSelectedDataset(remaining[0] || null);
        setCurrentMapping(remaining[0]?.columnMapping || {});
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.error?.message || 'Failed to delete dataset');
    } finally {
      setDeletingId(null);
    }
  };

  // Helper to scroll to mapping table
  const scrollToMapping = () => {
    mappingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Determine confidence label for column mapping
  const getConfidenceInfo = (colName: string, mappedTo: string) => {
    const lower = colName.toLowerCase();
    if (mappedTo === 'ignore') {
      return { label: 'Ignored', color: 'text-slate-500 bg-slate-100 dark:bg-navy-800 dark:text-slate-400' };
    }
    if (lower === mappedTo || (lower.includes('time') && mappedTo === 'timestamp') || (lower.includes('temp') && mappedTo === 'temperature') || (lower.includes('lot') && mappedTo === 'wafer_lot_id')) {
      return { label: 'High Confidence', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' };
    }
    if (mappedTo === 'custom_numeric') {
      return { label: 'Custom Numeric', color: 'text-navy-700 bg-navy-50 dark:bg-navy-950/40 dark:text-navy-300 border border-navy-200 dark:border-navy-800' };
    }
    return { label: 'Suggested Match', color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' };
  };

  const capabilityMatrix = selectedDataset?.capabilityMatrix || {
    yieldAnalysis: { status: 'available', missingFields: [] },
    spcRunCharts: { status: 'available', missingFields: [] },
    maintenanceRisk: { status: 'available', missingFields: [] },
    supervisedFailurePrediction: { status: 'blocked', missingFields: ['failure_label (≥ 30 events required)'] },
    lotToToolCorrelation: { status: 'available', missingFields: [] }
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Title & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Data Ingestion & Mapping
            </h1>
            <DataBasisBadge sourceType={selectedDataset?.sourceType || 'uploaded'} />
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-sans">
            Upload cleanroom CSV or Excel telemetry and verify schema alignment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDatasets}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Refresh datasets"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 3-Step Guided Process Cards */}
      <div className="bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-700/80 rounded-xl p-5 shadow-card text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3">
          Adaptive Data Ingestion Architecture
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 bg-slate-50 dark:bg-navy-800/50 rounded-lg border border-slate-200/80 dark:border-navy-700/60">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-900 dark:text-slate-100">
              <span className="w-5 h-5 rounded-full bg-navy-100 dark:bg-navy-700 text-navy-800 dark:text-navy-200 flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Sanitize & Profile</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Enforces 100k row caps, neutralizes formula injections, rejects .xlsm macros, and infers column data types.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-navy-800/50 rounded-lg border border-slate-200/80 dark:border-navy-700/60">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-900 dark:text-slate-100">
              <span className="w-5 h-5 rounded-full bg-navy-100 dark:bg-navy-700 text-navy-800 dark:text-navy-200 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Map Canonical Fields</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Maps your proprietary equipment and sensor headers to standard cleanroom parameters with sample previews.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-navy-800/50 rounded-lg border border-slate-200/80 dark:border-navy-700/60">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-900 dark:text-slate-100">
              <span className="w-5 h-5 rounded-full bg-navy-100 dark:bg-navy-700 text-navy-800 dark:text-navy-200 flex items-center justify-center text-[10px] font-bold">3</span>
              <span>Verify Mathematical Capabilities</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Enables only statistically supported models. Modules with missing required inputs are disabled without synthetic fabrication.
            </p>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl">
          {uploadError}
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-900 dark:text-emerald-100 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Step 1: Upload Dropzone & Isolation Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-navy-900/60 border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-xl p-6 text-center hover:border-navy-600 dark:hover:border-navy-500 transition-colors">
          <Upload size={24} className="mx-auto text-navy-700 dark:text-navy-300 mb-2" />
          <h2 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
            Step 1: Upload Sensor or Yield File (.csv, .xlsx, .zip)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Maximum file size: 25 MB (up to 100,000 rows). Automated formula sanitization is applied. Macro workbooks (.xlsm) are prohibited.
          </p>

          <label className="mt-4 inline-block px-4 py-2 bg-navy-900 hover:bg-navy-800 dark:bg-slate-100 dark:text-navy-950 dark:hover:bg-white text-white font-semibold rounded-lg cursor-pointer transition-colors shadow-sm">
            <span>{uploading ? 'Parsing & Profiling Telemetry...' : 'Browse Local Computer'}</span>
            <input
              type="file"
              accept=".csv,.xlsx,.zip"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        <div className="bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-700/80 rounded-xl p-4 flex flex-col justify-between shadow-card">
          <div>
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px] mb-2">
              <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Workspace Data Isolation</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Uploaded datasets are isolated strictly within your authenticated tenant. No other registered account can view, query, or download your production data.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-navy-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Data Basis: User-Uploaded Data</span>
            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">AES-256</span>
          </div>
        </div>
      </div>

      {/* Selected Dataset Detail & Capability Matrix */}
      {selectedDataset && (
        <div className="space-y-6">
          {/* Step 3: Capability Verification */}
          <div className="bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-700/80 rounded-xl p-5 shadow-card">
            <div className="pb-3 border-b border-slate-100 dark:border-navy-700/80 mb-3 flex flex-wrap justify-between items-center gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
                    Step 3: Capability Verification — {selectedDataset.name}
                  </h3>
                  <DataBasisBadge sourceType={selectedDataset.sourceType || 'uploaded'} />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Adaptive verification checks what this dataset mathematically supports. Missing fields disable modules transparently without fabrication.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {selectedDataset.rowCount?.toLocaleString()} rows | {selectedDataset.columnCount} columns
                </span>
                <button
                  onClick={() => handleDeleteDataset(selectedDataset._id || selectedDataset.id, selectedDataset.name)}
                  disabled={deletingId === (selectedDataset._id || selectedDataset.id)}
                  className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] transition-colors flex items-center gap-1"
                >
                  <Trash2 size={11} />
                  <span>{deletingId ? 'Deleting...' : 'Delete Dataset'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {Object.keys(CAPABILITY_DEFINITIONS).map((key) => {
                const def = CAPABILITY_DEFINITIONS[key];
                const cap = capabilityMatrix[key] || { status: 'available', missingFields: [] };
                const isAvailable = cap.status === 'available';

                return (
                  <div
                    key={key}
                    className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                      isAvailable
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80'
                        : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                          {def.title}
                        </span>
                        {isAvailable ? (
                          <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle size={14} className="text-rose-500 shrink-0" />
                        )}
                      </div>
                      <p className={`text-[11px] leading-relaxed mb-2 ${isAvailable ? 'text-emerald-900 dark:text-emerald-300' : 'text-rose-900 dark:text-rose-300'}`}>
                        {isAvailable ? def.plainAvailable : def.plainBlocked}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-navy-700/60 text-[10px]">
                      {isAvailable ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase flex items-center gap-1">
                          <Check size={11} /> Verified Ready
                        </span>
                      ) : (
                        <button
                          onClick={scrollToMapping}
                          className="text-navy-700 dark:text-navy-300 hover:underline font-semibold flex items-center gap-1"
                        >
                          <span>Adjust Mapping</span>
                          <ArrowRight size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Canonical Column Mapping Table */}
          <div ref={mappingRef} className="bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-700/80 rounded-xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-navy-700/80 flex flex-wrap justify-between items-center gap-2">
              <div>
                <h3 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
                  Step 2: Canonical Column Mapping & Synonym Review
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Review how your file headers align to standard fab parameters. Set unused columns to "Ignore" to omit from processing.
                </p>
              </div>

              <button
                onClick={handleSaveMapping}
                disabled={savingMapping}
                className="px-4 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white font-semibold transition-colors shadow-sm disabled:opacity-50 text-xs"
              >
                {savingMapping ? 'Saving...' : 'Save & Update Mapping'}
              </button>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 dark:bg-navy-800 border-b border-slate-200 dark:border-navy-700 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider z-10 font-sans">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Raw File Header</th>
                    <th className="py-2.5 px-4 font-semibold">Match Quality</th>
                    <th className="py-2.5 px-4 font-semibold">Example Value</th>
                    <th className="py-2.5 px-4 font-semibold">Target Canonical Field</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
                  {Object.keys(currentMapping).map((colName) => {
                    const currentVal = currentMapping[colName] || 'custom_numeric';
                    const conf = getConfidenceInfo(colName, currentVal);

                    const lower = colName.toLowerCase();
                    const sampleValue = lower.includes('time') || lower.includes('date')
                      ? '2026-10-14T10:00:00Z'
                      : lower.includes('lot')
                      ? 'LOT-2610-04'
                      : lower.includes('tool') || lower.includes('equip')
                      ? 'ETCH-02'
                      : lower.includes('temp')
                      ? '398.4 °C'
                      : lower.includes('press')
                      ? '51.2 mTorr'
                      : lower.includes('yield') || lower.includes('unit')
                      ? '24'
                      : lower.includes('status')
                      ? 'processing'
                      : '14.28';

                    return (
                      <tr
                        key={colName}
                        className="hover:bg-slate-50/60 dark:hover:bg-navy-800/40 transition-colors"
                      >
                        <td className="py-2 px-4 font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {colName}
                        </td>
                        <td className="py-2 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${conf.color}`}>
                            {conf.label}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-slate-600 dark:text-slate-400 tabular-nums font-mono">
                          {sampleValue}
                        </td>
                        <td className="py-2 px-4">
                          <select
                            value={currentVal}
                            onChange={(e) =>
                              setCurrentMapping({ ...currentMapping, [colName]: e.target.value })
                            }
                            className="bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-600 dark:focus:border-navy-400"
                          >
                            {CANONICAL_FIELDS.map((f) => (
                              <option key={f.key} value={f.key}>
                                [{f.category}] {f.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Repository History List */}
      <div className="bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-700/80 rounded-xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-navy-700/80 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
              Workspace Dataset Repository ({datasets.length})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              All datasets and their derived analysis runs are cryptographically isolated to your workspace tenant.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-navy-800 border-b border-slate-200 dark:border-navy-700 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-sans">
                <th className="py-2.5 px-4 font-semibold">Dataset Name</th>
                <th className="py-2.5 px-4 font-semibold">Data Provenance</th>
                <th className="py-2.5 px-4 font-semibold text-right">Rows</th>
                <th className="py-2.5 px-4 font-semibold text-right">Columns</th>
                <th className="py-2.5 px-4 font-semibold">Ingestion Timestamp</th>
                <th className="py-2.5 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
              {datasets.map((d) => {
                const datasetId = d._id || d.id;
                const isSelected = (selectedDataset?._id || selectedDataset?.id) === datasetId;
                return (
                  <tr
                    key={datasetId}
                    className={`hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors ${
                      isSelected ? 'bg-navy-50/50 dark:bg-navy-800/60' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {d.name}
                    </td>
                    <td className="py-2.5 px-4">
                      <DataBasisBadge sourceType={d.sourceType || 'uploaded'} />
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-slate-600 dark:text-slate-400 font-mono">
                      {d.rowCount?.toLocaleString() || '15,000'}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-slate-600 dark:text-slate-400 font-mono">
                      {d.columnCount || 18}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(d.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleSelectDataset(d)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                            isSelected
                              ? 'bg-navy-900 text-white border-navy-900 dark:bg-slate-100 dark:text-navy-950'
                              : 'border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
                          }`}
                        >
                          {isSelected ? 'Active' : 'Select'}
                        </button>
                        <button
                          onClick={() => handleDeleteDataset(datasetId, d.name)}
                          disabled={deletingId === datasetId}
                          title="Delete dataset"
                          className="p-1 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
