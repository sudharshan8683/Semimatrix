import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '../../api/client'
import { 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  RefreshCw, 
  Send, 
  HelpCircle,
  AlertOctagon,
  Layers
} from 'lucide-react'

interface SampleWafer {
  row_index: number
  label: string
  description: string
  row: (number | null)[]
}

interface PredictionItem {
  row_index: number
  probability: number
  flagged: boolean
}

interface PredictionResult {
  threshold: number
  flagged_count: number
  total_rows: number
  predictions: PredictionItem[]
}

export const SecomPredictor: React.FC = () => {
  const [samples, setSamples] = useState<SampleWafer[]>([])
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | 'all' | 'custom'>(0)
  const [threshold, setThreshold] = useState<number>(0.3)
  const [customInput, setCustomInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch preloaded sample wafers from backend on mount
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const { data } = await apiClient.get('/predictions/sample-rows')
        if (data?.samples) {
          setSamples(data.samples)
        }
      } catch (err: any) {
        console.warn('Could not load sample rows from backend:', err?.message)
      }
    }
    fetchSamples()
  }, [])

  const handlePredict = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      let rowsToSend: (number | null)[][] = []

      if (selectedSampleIndex === 'all') {
        if (samples.length === 0) {
          throw new Error('No sample rows loaded from server.')
        }
        rowsToSend = samples.map(s => s.row)
      } else if (selectedSampleIndex === 'custom') {
        const tokens = customInput.trim().split(/[\s,]+/)
        if (tokens.length !== 590) {
          throw new Error(`Expected 590 raw feature columns, got ${tokens.length}. Check your pasted data.`)
        }
        const parsed = tokens.map(t => (t === 'NaN' || t === 'nan' || t === 'null' ? null : parseFloat(t)))
        rowsToSend = [parsed]
      } else {
        const chosen = samples[selectedSampleIndex]
        if (!chosen) {
          throw new Error('Please select a sample wafer.')
        }
        rowsToSend = [chosen.row]
      }

      const { data } = await apiClient.post<PredictionResult>('/predictions/defect', {
        rows: rowsToSend,
        threshold: threshold
      })

      setResult(data)
    } catch (err: any) {
      const serverMessage = err.response?.data?.detail || err.message || 'Defect prediction failed'
      setError(serverMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      className="glass-panel p-6 rounded-2xl border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand/10 border border-brand/20 text-brand">
            <Cpu size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              SECOM Wafer Defect Risk Model
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                RandomForest (50 Features)
              </span>
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Evaluates raw 590-sensor telemetry streams through imputation, scaling, and feature selection.
            </p>
          </div>
        </div>

        {/* Threshold Quick Selector */}
        <div className="flex items-center gap-2 bg-surface/50 border border-white/5 rounded-xl p-1.5 self-start sm:self-auto">
          <Sliders size={16} className="text-text-muted ml-1" />
          <span className="text-xs text-text-muted font-medium">Cutoff:</span>
          {[0.2, 0.3, 0.5].map((val) => (
            <button
              key={val}
              onClick={() => setThreshold(val)}
              className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-all ${
                threshold === val 
                  ? 'bg-brand text-black font-bold shadow-sm' 
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              {val.toFixed(1)} {val === 0.3 ? '★' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Threshold Explanation Note */}
      <div className="mt-4 p-3 rounded-xl bg-brand/5 border border-brand/10 flex items-start gap-2.5 text-xs text-text-secondary">
        <HelpCircle size={16} className="text-brand shrink-0 mt-0.5" />
        <span>
          <strong className="text-brand">Evaluation Note:</strong> The default 0.5 cutoff catches very few actual defects on this highly-imbalanced dataset. A threshold of <span className="text-white font-mono font-bold">0.2 - 0.3</span> captures significantly higher true defects at a manageable false-alarm trade-off.
        </span>
      </div>

      {/* Input Selection */}
      <div className="mt-6 space-y-4">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
          Select Test Input Data
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {samples.length > 0 ? (
            samples.slice(0, 3).map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedSampleIndex(idx)}
                className={`p-3.5 rounded-xl border text-left transition-all duration-200 ${
                  selectedSampleIndex === idx
                    ? 'bg-brand/15 border-brand/50 text-white shadow-sm shadow-brand/10'
                    : 'bg-surface/30 border-white/5 text-text-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{s.label}</span>
                  {idx === 2 ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      Defect Risk
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      Nominal
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted">590 sensor readings</p>
              </button>
            ))
          ) : (
            <div className="col-span-3 text-xs text-text-muted p-3 bg-white/5 rounded-xl animate-pulse">
              Loading test samples from server...
            </div>
          )}

          <button
            type="button"
            onClick={() => setSelectedSampleIndex('all')}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 ${
              selectedSampleIndex === 'all'
                ? 'bg-brand/15 border-brand/50 text-white shadow-sm shadow-brand/10'
                : 'bg-surface/30 border-white/5 text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Layers size={14} className="text-brand" /> Batch Test
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">
                All 5 Rows
              </span>
            </div>
            <p className="text-xs text-text-muted">Score entire batch</p>
          </button>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand to-brand-accent text-black font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Running Inference...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Execute Defect Prediction (Threshold {threshold.toFixed(2)})</span>
              </>
            )}
          </button>

          <span className="text-xs text-text-muted">
            Calls <code className="text-text-primary px-1.5 py-0.5 bg-black/40 rounded border border-white/5 font-mono">POST /api/predictions/defect</code>
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div 
          className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertOctagon size={18} className="shrink-0 mt-0.5 text-red-400" />
          <div className="flex-1">
            <div className="font-semibold text-red-200">Prediction Error</div>
            <div className="text-xs text-red-300/90 mt-0.5">{error}</div>
          </div>
        </motion.div>
      )}

      {/* Results Display */}
      <AnimatePresence>
        {result && (
          <motion.div
            className="mt-6 pt-6 border-t border-border/40 space-y-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Prediction Results
                <span className="text-xs font-mono font-normal text-text-muted">
                  ({result.flagged_count} of {result.total_rows} flagged at cutoff {result.threshold})
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.predictions.map((p) => {
                const pct = (p.probability * 100).toFixed(2)
                return (
                  <div
                    key={p.row_index}
                    className={`p-4 rounded-xl border transition-all ${
                      p.flagged
                        ? 'bg-red-500/10 border-red-500/30 text-white'
                        : 'bg-surface/40 border-white/5 text-text-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Row #{p.row_index}
                      </span>
                      {p.flagged ? (
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                          <AlertTriangle size={12} /> FLAGGED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 size={12} /> PASS
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-xs text-text-secondary">Defect Probability</span>
                      <span className="text-xl font-extrabold font-mono text-white">
                        {pct}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          p.flagged 
                            ? 'bg-gradient-to-r from-amber-500 to-red-500' 
                            : 'bg-gradient-to-r from-emerald-500 to-brand'
                        }`}
                        style={{ width: `${Math.min(p.probability * 100 * 2, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-text-muted mt-2 font-mono">
                      <span>Cutoff: {result.threshold.toFixed(2)}</span>
                      <span>Raw: {p.probability.toFixed(4)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
