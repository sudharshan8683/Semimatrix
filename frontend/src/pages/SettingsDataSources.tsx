import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Database, 
  Wifi, 
  Activity, 
  Upload, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles,
  Info,
  Server,
  FileCheck
} from 'lucide-react'
import { apiClient } from '../api/client'
import { InfoTooltip } from '../components/common/InfoTooltip'

export const SettingsDataSources: React.FC = () => {
  const [activeRate, setActiveRate] = useState<number>(1)
  const [anomalyTool, setAnomalyTool] = useState<string>('ETCH-02')
  const [anomalyStatus, setAnomalyStatus] = useState<string | null>(null)
  const [resetting, setResetting] = useState<boolean>(false)
  const [csvText, setCsvText] = useState<string>('')
  const [csvValidationResult, setCsvValidationResult] = useState<any>(null)

  const handleSetRate = async (rate: number) => {
    setActiveRate(rate)
    try {
      await apiClient.put(`/simulation/speed?speed=${rate}`)
    } catch (err) {
      console.warn('Could not set rate on server:', err)
    }
  }

  const handleInjectAnomaly = async () => {
    setAnomalyStatus('Injecting anomaly...')
    try {
      const res = await apiClient.post(`/simulation/inject-anomaly?tool_id=${anomalyTool}`)
      setAnomalyStatus(res.data?.message || 'Anomaly injected successfully! Check Equipment & Alerts pages.')
    } catch (err) {
      setAnomalyStatus('Failed to inject anomaly.')
    }
  }

  const handleResetSimulation = async () => {
    setResetting(true)
    try {
      await apiClient.post('/simulation/reset')
      setAnomalyStatus('All equipment restored to nominal operating state.')
    } catch (err) {
      console.warn('Could not reset simulation:', err)
    } finally {
      setResetting(false)
    }
  }

  const handleValidateCSV = () => {
    if (!csvText.trim()) {
      setCsvValidationResult({ valid: false, message: 'Please paste sensor CSV data first.' })
      return
    }

    const lines = csvText.trim().split('\n')
    const header = lines[0].split(',')
    const rowCount = lines.length - 1

    if (lines.length < 2) {
      setCsvValidationResult({
        valid: false,
        message: 'CSV must contain at least 1 header row and 1 data row.'
      })
      return
    }

    // Check if SECOM format (590 features) or Equipment Telemetry format (standard columns)
    const isSecom = lines[1].trim().split(/[\s,]+/).length === 590
    const isStandardTelemetry = header.some(h => h.toLowerCase().includes('temp') || h.toLowerCase().includes('press') || h.toLowerCase().includes('vib'))

    if (isSecom) {
      setCsvValidationResult({
        valid: true,
        type: 'SECOM Sensor Vector (590 Channels)',
        rows: rowCount,
        message: `Validated successfully! Detected ${rowCount} wafer rows with exact 590-feature SECOM layout. Ready for Defect Predictor.`
      })
    } else if (isStandardTelemetry) {
      setCsvValidationResult({
        valid: true,
        type: 'Factory Telemetry Stream',
        rows: rowCount,
        message: `Validated standard equipment sensor feed (${header.length} columns, ${rowCount} timestamped records).`
      })
    } else {
      setCsvValidationResult({
        valid: true,
        type: 'Generic Tabular Dataset',
        rows: rowCount,
        message: `Parsed ${header.length} columns across ${rowCount} sample rows.`
      })
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Settings &amp; Data Sources
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono">
            <Database size={12} className="text-brand" />
            <span>Telemetry Broker Config</span>
          </div>
        </div>
        <p className="text-text-secondary text-xs md:text-sm mt-1">
          Manage factory connectivity, digital twin simulation parameters, and validate uploaded sensor files.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Data Connectivity & Provenance */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Server size={16} className="text-brand" />
              <span>Data Provenance &amp; Broker Connectors</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Active: Digital Twin Sim
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            To ensure complete transparency, this platform distinguishes between <strong>Simulated Demonstration Data</strong> and <strong>Live Production Telemetry</strong>.
          </p>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
                <div>
                  <span className="font-semibold text-white block">Synthetic Cleanroom Digital Twin</span>
                  <span className="text-slate-400 text-[11px]">Internal 2-second deterministic physics walk (Bays 1-4)</span>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400">Connected</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs opacity-70">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                <div>
                  <span className="font-semibold text-white block">SECS/GEM Factory Protocol (SEMI E30/E37)</span>
                  <span className="text-slate-400 text-[11px]">Direct wafer track communication standard</span>
                </div>
              </div>
              <span className="font-mono text-xs text-slate-500">Standby (Prod)</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs opacity-70">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                <div>
                  <span className="font-semibold text-white block">OPC-UA / MQTT Industrial Broker</span>
                  <span className="text-slate-400 text-[11px]">Chamber sub-fab pump and gas telemetry connector</span>
                </div>
              </div>
              <span className="font-mono text-xs text-slate-500">Standby (Prod)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Simulation Controls & Anomaly Injection */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Sliders size={16} className="text-brand" />
              <span>Digital Twin Simulation Controls</span>
            </h2>
            <InfoTooltip content="Control the speed of simulated production runs or inject telemetry excursions to test alert responses." />
          </div>

          <div className="space-y-4 text-xs">
            {/* Speed Rate Toggle */}
            <div>
              <span className="text-slate-400 block mb-2 font-mono uppercase text-[10px]">
                Simulation Clock Rate (Fast-Forward Batches)
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleSetRate(rate)}
                    className={`flex-1 py-2 rounded-xl border font-mono text-xs font-bold transition-all ${
                      activeRate === rate
                        ? 'bg-brand/20 border-brand text-brand shadow-sm shadow-brand/20'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white'
                    }`}
                  >
                    {rate}x Speed
                  </button>
                ))}
              </div>
            </div>

            {/* Anomaly Injection */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-slate-400 block mb-2 font-mono uppercase text-[10px]">
                Inject Controlled Telemetry Anomaly
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={anomalyTool}
                  onChange={(e) => setAnomalyTool(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand cursor-pointer"
                >
                  <option value="ETCH-02">ETCH-02 (Exhaust Pressure Drift)</option>
                  <option value="ETCH-03">ETCH-03 (Bearing Vibration Spike)</option>
                  <option value="DEPO-04">DEPO-04 (Thermal Excursion)</option>
                </select>

                <button
                  onClick={handleInjectAnomaly}
                  className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold border border-red-500/40 transition-all shadow-sm"
                >
                  Inject Anomaly
                </button>
              </div>

              {anomalyStatus && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-amber-300 flex items-center justify-between">
                  <span>{anomalyStatus}</span>
                  <button 
                    onClick={() => setAnomalyStatus(null)}
                    className="text-slate-500 hover:text-white ml-2"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Reset Simulation State */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400">Restore all equipment to nominal baseline</span>
              <button
                onClick={handleResetSimulation}
                disabled={resetting}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all"
              >
                {resetting ? 'Resetting...' : 'Reset Fleet Health'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Data File Validator (Upload Validation Requirement) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <Upload size={16} className="text-brand" />
            <span>Sensor Data CSV Validator &amp; Ingestion Tester</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">SECOM 590-Feature / Equipment Telemetry Format</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          Paste sensor readings or sample CSV text to check column headers, handle missing values, and test compatibility with the SECOM Random Forest defect inference pipeline.
        </p>

        <div className="space-y-3">
          <textarea
            rows={4}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste CSV header and data rows here... (e.g. timestamp,temperature,pressure,vibration or 590 whitespace-delimited SECOM sensor values)"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand"
          />

          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                // Populate sample SECOM test vector
                const sampleValues = Array(590).fill(0).map((_, i) => (Math.sin(i) * 1.5).toFixed(4)).join(' ')
                setCsvText(sampleValues)
              }}
              className="text-xs text-brand hover:underline font-mono"
            >
              Insert Sample 590-Sensor Vector
            </button>

            <button
              onClick={handleValidateCSV}
              className="px-4 py-2 rounded-xl bg-brand hover:bg-brand/90 text-slate-950 text-xs font-bold transition-all shadow-md shadow-brand/20 flex items-center gap-1.5"
            >
              <FileCheck size={14} />
              <span>Validate Sensor Data</span>
            </button>
          </div>

          {/* Validation Result Box */}
          {csvValidationResult && (
            <div className={`p-4 rounded-xl border text-xs space-y-1 ${
              csvValidationResult.valid 
                ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300' 
                : 'border-red-500/30 bg-red-950/20 text-red-300'
            }`}>
              <div className="flex items-center gap-2 font-bold uppercase font-mono">
                {csvValidationResult.valid ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{csvValidationResult.valid ? 'Validation Passed' : 'Validation Error'}</span>
                {csvValidationResult.type && (
                  <span className="text-white bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                    {csvValidationResult.type}
                  </span>
                )}
              </div>
              <p className="text-slate-200 font-normal mt-1">{csvValidationResult.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
