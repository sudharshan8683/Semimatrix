import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';

interface UploadDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UploadDataModal: React.FC<UploadDataModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upload' | 'synthetic'>('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synthetic options
  const [scenario, setScenario] = useState('all');
  const [days, setDays] = useState(7);
  const [seeding, setSeeding] = useState(false);

  if (!isOpen) return null;

  const isValidExtension = (fileName: string) => {
    const lower = fileName.toLowerCase();
    return lower.endsWith('.csv') || lower.endsWith('.xlsx') || lower.endsWith('.zip');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.xlsm')) {
        setUploadError('Macro-enabled workbooks (.xlsm) are rejected for cleanroom security.');
        setSelectedFile(null);
        return;
      }
      if (!isValidExtension(file.name)) {
        setUploadError('Invalid file format. Please upload a .csv, .xlsx, or .zip file.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setSuccessMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.xlsm')) {
        setUploadError('Macro-enabled workbooks (.xlsm) are rejected for cleanroom security.');
        return;
      }
      if (!isValidExtension(file.name)) {
        setUploadError('Invalid file format. Please upload a .csv, .xlsx, or .zip file.');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setSuccessMsg(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await apiClient.post('/datasets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMsg(`Successfully uploaded & profiled ${selectedFile.name}. Opening Datasets & Mapping...`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        navigate('/datasets');
      }, 1200);
    } catch (err: any) {
      setUploadError(err.response?.data?.error?.message || 'File upload failed. Please verify format.');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateSynthetic = async () => {
    setSeeding(true);
    setUploadError(null);
    setSuccessMsg(null);

    try {
      await apiClient.post('/datasets/seed-synthetic', {
        seed: Math.floor(Math.random() * 1000),
        days,
        toolCountPerType: 3,
        scenario
      });
      setSuccessMsg('Synthetic fab telemetry generated and synced successfully.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setUploadError(err.response?.data?.error?.message || 'Failed to generate synthetic data.');
    } finally {
      setSeeding(false);
    }
  };

  const downloadSampleCsv = () => {
    const link = document.createElement('a');
    link.href = '/semimatrix_synthetic_cleanroom_data.csv';
    link.download = 'semimatrix_synthetic_cleanroom_data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSampleZip = () => {
    const link = document.createElement('a');
    link.href = '/semimatrix_cleanroom_sample.zip';
    link.download = 'semimatrix_cleanroom_sample.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center">
              <UploadCloud size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white leading-none">
                Upload Data File
              </h2>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                CSV, Excel, ZIP or Generate Synthetic Telemetry
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-6">
          <button
            onClick={() => {
              setActiveTab('upload');
              setUploadError(null);
            }}
            className={`py-3 text-xs font-semibold border-b-2 mr-6 flex items-center gap-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet size={15} />
            <span>Upload File (.csv, .xlsx, .zip)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('synthetic');
              setUploadError(null);
            }}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'synthetic'
                ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={15} />
            <span>Generate Synthetic Telemetry</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {uploadError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <span>{uploadError}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/datasets');
                }}
                className="font-semibold underline shrink-0 hover:text-emerald-900 dark:hover:text-emerald-100"
              >
                View Now &rarr;
              </button>
            </div>
          )}

          {activeTab === 'upload' ? (
            <div className="space-y-4">
              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-white rounded-xl p-8 text-center cursor-pointer bg-neutral-50 dark:bg-neutral-950 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.zip"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3 text-neutral-600 dark:text-neutral-300">
                  <FileSpreadsheet size={24} />
                </div>
                {selectedFile ? (
                  <div>
                    <span className="font-semibold text-sm text-neutral-900 dark:text-white block">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Click to choose another
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-xs text-neutral-900 dark:text-white block">
                      Click to browse or drag & drop cleanroom file
                    </span>
                    <span className="text-[11px] text-neutral-500 block mt-1">
                      Supports CSV, XLSX, ZIP up to 50MB
                    </span>
                  </div>
                )}
              </div>

              {/* Sample Template Helper */}
              <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                <span className="text-neutral-500 text-[11px]">Need cleanroom sample data?</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={downloadSampleCsv}
                    className="text-neutral-900 dark:text-white hover:underline font-medium text-[11px] inline-flex items-center gap-1"
                  >
                    <FileText size={12} />
                    <span>Sample CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadSampleZip}
                    className="text-neutral-900 dark:text-white hover:underline font-medium text-[11px] inline-flex items-center gap-1"
                  >
                    <FileSpreadsheet size={12} />
                    <span>Sample ZIP</span>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <button
                  onClick={handleUploadSubmit}
                  disabled={!selectedFile || uploading}
                  className="w-full py-2.5 px-4 bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 shadow-sm"
                >
                  {uploading && <RefreshCw size={14} className="animate-spin" />}
                  <span>{uploading ? 'Processing & Ingesting File...' : 'Upload & Ingest File'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Cleanroom Excursion Scenario
                </label>
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 text-xs font-medium cursor-pointer"
                >
                  <option value="all">Full Factory (Nominal & Multi-bay Excursions)</option>
                  <option value="temp_drift">Thermal Excursion (Chamber Temperature Drift)</option>
                  <option value="rf_spike">Plasma RF Power Instability (Nelson Rule 1)</option>
                  <option value="pressure_drift">Etcher Throttle Valve Pressure Drift</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Simulation Window
                </label>
                <div className="flex gap-2">
                  {[3, 7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDays(d)}
                      className={`flex-1 py-1.5 rounded-lg font-medium border text-xs transition-colors ${
                        days === d
                          ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 font-semibold'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                      }`}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={handleGenerateSynthetic}
                  disabled={seeding}
                  className="w-full py-2.5 px-4 bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 shadow-sm"
                >
                  {seeding && <RefreshCw size={14} className="animate-spin" />}
                  <span>{seeding ? 'Generating Synthetic Run...' : 'Generate & Load Synthetic Data'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
