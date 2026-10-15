import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { DataBasisBadge } from '../components/common/DataBasisBadge';
import { StatusPill } from '../components/common/StatusPill';
import {
  FileSpreadsheet,
  Download,
  Plus,
  RefreshCw,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  ShieldCheck
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form State
  const [title, setTitle] = useState('Cleanroom Operations & Excursion Report');
  const [analysisType, setAnalysisType] = useState('overview');
  const [dataBasis, setDataBasis] = useState('synthetic');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/reports');
      const list = res.data.data.reports || [];
      setReports(list);
      if (list.length > 0 && !selectedReport) {
        setSelectedReport(list[0]);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await apiClient.post('/reports/generate', {
        title,
        analysisType,
        dataBasis,
        startDate: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        format: 'pdf'
      });
      const newReport = res.data.data.report;
      setReports([newReport, ...reports]);
      setSelectedReport(newReport);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadCsv = async (reportId: string) => {
    try {
      const res = await apiClient.get(`/reports/${reportId}/export/csv`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `semimatrix_report_${reportId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download CSV:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Control Bar */}
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Technical Reports & Exports
              </h1>
            </div>
          </div>

          <button
            onClick={fetchReports}
            disabled={loading}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm self-start lg:self-auto"
            title="Refresh reports"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Generate Form & Reports List (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Generate Report Card */}
          <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-5 shadow-sm text-xs">
            <h2 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-3">
              Generate Engineering Report
            </h2>

            <form onSubmit={handleGenerate} className="space-y-3.5">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">REPORT TITLE</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#18243C] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-600 dark:focus:border-sky-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">ANALYSIS SCOPE</label>
                <select
                  value={analysisType}
                  onChange={(e) => setAnalysisType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#18243C] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="overview">Operations Overview (Fleet Health & Yield)</option>
                  <option value="yield">Wafer-Lot Yield & Defect Decomposition</option>
                  <option value="spc">SPC Shewhart Rule Excursions</option>
                  <option value="maintenance">Predictive Maintenance & Fleet Risk</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">DATA PROVENANCE</label>
                <select
                  value={dataBasis}
                  onChange={(e) => setDataBasis(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#18243C] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="synthetic">Simulated Cleanroom Baseline</option>
                  <option value="uploaded">Uploaded Factory Dataset</option>
                  <option value="benchmark">SECOM Benchmark</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full py-2.5 bg-[#16324F] hover:bg-navy-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Plus size={14} />
                <span>{generating ? 'Compiling Report...' : 'Compile Certified Report'}</span>
              </button>
            </form>
          </div>

          {/* Archived Reports Roster */}
          <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl shadow-sm overflow-hidden text-xs">
            <div className="p-3.5 border-b border-[#E4E7EC] dark:border-[#1E2D4A] font-semibold text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-[#0E1626]">
              Workspace Reports Archive ({reports.length})
            </div>

            <div className="divide-y divide-[#E4E7EC] dark:divide-[#1E2D4A] max-h-80 overflow-y-auto">
              {reports.map((rep) => {
                const isSelected = selectedReport?.id === rep.id;
                return (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedReport(rep)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-navy-50/80 dark:bg-navy-900/50 border-l-4 border-l-[#16324F] dark:border-l-sky-400 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-white truncate mb-1">
                      {rep.title}
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span className="uppercase font-medium">{rep.analysisType}</span>
                      <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Report Preview & CSV Export (8 cols) */}
        <div className="lg:col-span-8">
          {!selectedReport ? (
            <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-12 text-center text-xs text-slate-500">
              Select or generate a report to review technical findings and export sanitized CSV.
            </div>
          ) : (
            <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-6 shadow-sm space-y-6 text-xs">
              {/* Report Header */}
              <div className="pb-4 border-b border-[#E4E7EC] dark:border-[#1E2D4A] flex flex-wrap justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold text-base text-slate-900 dark:text-white">
                      {selectedReport.title}
                    </span>
                    <DataBasisBadge sourceType={selectedReport.dataBasis || 'synthetic'} />
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Report ID: <span className="font-mono">{selectedReport.id}</span> | Compiled: {new Date(selectedReport.createdAt).toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadCsv(selectedReport.id)}
                  className="px-3 py-1.5 rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A] bg-slate-50 dark:bg-[#18243C] hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-sm"
                >
                  <Download size={13} />
                  <span>Export Defanged CSV</span>
                </button>
              </div>

              {/* Plain-Language Summary Block (Layer 1) */}
              <div className="p-4 bg-navy-50/70 dark:bg-navy-950/30 border border-navy-200 dark:border-navy-900/60 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#16324F] dark:text-sky-300 block mb-1">
                  1. Plain-Language Executive Summary
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                  {selectedReport.summary ||
                    'During the 7-day monitoring window, line yield averaged 93.42% across 28 processed wafer lots. Tool DEPO-01 exhibited thermal drift associated with elevated wafer thickness variance, while ETCH-02 experienced a transient chamber pressure excursion. These findings represent candidate contributors and require physical tool inspection before component replacement.'}
                </p>
              </div>

              {/* KPI Summary Block */}
              <div>
                <h3 className="font-semibold uppercase tracking-wider text-slate-500 text-[10px] mb-2.5">
                  2. Operational KPI Rollup
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(selectedReport.kpiSummary || {
                    wafer_yield_pct: 93.42,
                    line_availability_pct: 96.2,
                    open_alerts_count: 3,
                    high_risk_equipment: 1
                  }).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-3 bg-slate-50 dark:bg-[#18243C] rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A]"
                    >
                      <span className="text-[10px] text-slate-500 uppercase block truncate">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-base font-display font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                        {typeof val === 'number' ? val.toFixed(2) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Diagnostic Findings */}
              <div>
                <h3 className="font-semibold uppercase tracking-wider text-slate-500 text-[10px] mb-2.5">
                  3. Key Diagnostic Findings & Statistical Evidence
                </h3>
                <div className="space-y-2">
                  {(selectedReport.findings || [
                    {
                      finding: 'CMP-01 exhibited a 24% downward drift in slurry delivery flow rate.',
                      evidence: 'Shewhart I-chart recorded 8 consecutive points below Center Line (Nelson Rule 2).',
                      confidence: 'high'
                    },
                    {
                      finding: 'ETCH-02 exhibited transient RF reflected power spikes during recipe ignition.',
                      evidence: '1 sample point exceeded Upper Control Limit (Nelson Rule 1).',
                      confidence: 'medium'
                    }
                  ]).map((f: any, i: number) => (
                    <div
                      key={i}
                      className="p-3.5 bg-slate-50 dark:bg-[#18243C] rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {f.finding}
                        </span>
                        <StatusPill
                          status={f.confidence === 'high' ? 'critical' : 'warning'}
                          customLabel={`${(f.confidence || 'medium').toUpperCase()} CONFIDENCE`}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Statistical Evidence: {f.evidence}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Engineering Actions */}
              <div>
                <h3 className="font-semibold uppercase tracking-wider text-slate-500 text-[10px] mb-2.5">
                  4. Prescribed Engineering Actions
                </h3>
                <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-inside">
                  {(selectedReport.recommendedActions || [
                    'Perform flow rate gravimetric calibration on CMP-01 dispense nozzle.',
                    'Inspect vacuum matching network capacitors on ETCH-02 for RF arcing residue.',
                    'Confirm recipe pressure tolerances before releasing lot LOT-240913-A.'
                  ]).map((act: string, idx: number) => (
                    <li key={idx}>{act}</li>
                  ))}
                </ul>
              </div>

              {/* Limitations & Assumptions Block */}
              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold mb-1">
                  <AlertTriangle size={14} />
                  <span className="uppercase text-[10px] tracking-wide">
                    Operational Boundaries & Scientific Disclaimer
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/90 dark:text-amber-300/80 leading-relaxed">
                  {selectedReport.limitationsAndAssumptions ||
                    'This report reflects data processed under deterministic cleanroom simulation assumptions. No live hardware actuator or SECS-GEM control interface is connected. Findings represent statistical associations and candidate contributors; physical cleanroom inspection is required prior to maintenance execution.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
