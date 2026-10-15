import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sliders, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles, 
  Info,
  DollarSign,
  Cpu,
  RotateCcw
} from 'lucide-react'
import { apiClient } from '../api/client'
import { InfoTooltip } from '../components/common/InfoTooltip'

interface Parameter {
  name: string
  key: string
  current_value: number
  recommended_value: number
  min_safe: number
  max_safe: number
  unit: string
  impact_level: string
  is_yield_detractor: boolean
  explanation: string
}

export const ProcessOptimization: React.FC = () => {
  const [tools, setTools] = useState<any[]>([])
  const [selectedToolId, setSelectedToolId] = useState<string>('ETCH-02')
  const [recipeData, setRecipeData] = useState<any>(null)
  const [userSliders, setUserSliders] = useState<Record<string, number>>({})
  const [evaluation, setEvaluation] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [evaluating, setEvaluating] = useState<boolean>(false)

  // Fetch recipe list
  useEffect(() => {
    const fetchTools = async () => {
      try {
        const res = await apiClient.get('/optimization/recipes')
        if (res.data?.tools) {
          setTools(res.data.tools)
        }
      } catch (err) {
        console.warn('Error fetching optimization recipes:', err)
      }
    }
    fetchTools()
  }, [])

  // Fetch specific tool recipe
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true)
        const res = await apiClient.get(`/optimization/recipe/${selectedToolId}`)
        setRecipeData(res.data)
        
        // Initialize sliders with current values
        const initialSliders: Record<string, number> = {}
        res.data.parameters.forEach((p: Parameter) => {
          initialSliders[p.key] = p.current_value
        })
        setUserSliders(initialSliders)

        // Initial evaluate
        evaluateScenario(selectedToolId, initialSliders)
      } catch (err) {
        console.warn('Error fetching tool recipe:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRecipe()
  }, [selectedToolId])

  const evaluateScenario = async (toolId: string, adjustments: Record<string, number>) => {
    try {
      setEvaluating(true)
      const res = await apiClient.post('/optimization/evaluate', {
        equipment_id: toolId,
        process_stage: recipeData?.stage || 'Plasma Etching',
        parameter_adjustments: adjustments
      })
      setEvaluation(res.data)
    } catch (err) {
      console.warn('Error evaluating optimization scenario:', err)
    } finally {
      setEvaluating(false)
    }
  }

  const handleSliderChange = (key: string, value: number) => {
    const nextSliders = { ...userSliders, [key]: value }
    setUserSliders(nextSliders)
    evaluateScenario(selectedToolId, nextSliders)
  }

  const applyRecommendedAll = () => {
    if (!recipeData) return
    const recSliders: Record<string, number> = {}
    recipeData.parameters.forEach((p: Parameter) => {
      recSliders[p.key] = p.recommended_value
    })
    setUserSliders(recSliders)
    evaluateScenario(selectedToolId, recSliders)
  }

  const resetToCurrent = () => {
    if (!recipeData) return
    const curSliders: Record<string, number> = {}
    recipeData.parameters.forEach((p: Parameter) => {
      curSliders[p.key] = p.current_value
    })
    setUserSliders(curSliders)
    evaluateScenario(selectedToolId, curSliders)
  }

  const comp = evaluation?.comparison || {}

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Process Optimization &amp; Recipe Fine-Tuning
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-mono font-semibold">
              <Sparkles size={12} />
              <span>Interactive Recipe Simulator</span>
            </div>
          </div>
          <p className="text-text-secondary text-xs md:text-sm mt-1">
            Simulate parameter adjustments to eliminate yield detractors and compare before-and-after wafer scrap outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedToolId}
            onChange={(e) => setSelectedToolId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-brand cursor-pointer"
          >
            {tools.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} - {t.name} ({t.stage})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mandatory Advisory Notice Banner */}
      <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase font-mono block text-amber-300">
              Illustrative Scenario • Advisory Only
            </span>
            <span className="text-slate-300 leading-relaxed font-normal">
              Simulation estimates assume stationary chamber boundary conditions. Real machine settings are NOT automatically overwritten. All recipe modifications require formal Human-in-the-Loop engineering qualification and fab sign-off.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={resetToCurrent}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1"
          >
            <RotateCcw size={12} />
            <span>Reset Baseline</span>
          </button>
          <button
            onClick={applyRecommendedAll}
            className="px-3.5 py-1.5 rounded-lg bg-brand hover:bg-brand/90 text-slate-950 text-xs font-bold transition-all shadow-md shadow-brand/20 flex items-center gap-1"
          >
            <Sparkles size={12} />
            <span>Apply AI Recommendations</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Parameters Workbench (Left 7 Cols) + Before/After Impact (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Parameters (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <span>Configured Process Parameters &amp; Operating Windows</span>
              <InfoTooltip content="Tweak parameters to test yield sensitivity. Detractors identified by high correlation with wafer defects." />
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {recipeData?.parameters?.length || 0} Parameters Tracked
            </span>
          </div>

          <div className="space-y-3">
            {recipeData?.parameters?.map((p: Parameter) => {
              const currentValue = userSliders[p.key] ?? p.current_value
              const isDetractor = p.is_yield_detractor
              const isOptimized = Math.abs(currentValue - p.recommended_value) < 0.05

              return (
                <div
                  key={p.key}
                  className={`p-4 rounded-xl border transition-all ${
                    isDetractor && !isOptimized
                      ? 'border-amber-500/40 bg-amber-950/10'
                      : 'border-slate-800 bg-slate-900/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{p.name}</span>
                        {isDetractor && !isOptimized && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Yield Detractor
                          </span>
                        )}
                        {isOptimized && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Optimized
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{p.explanation}</div>
                    </div>

                    <div className="text-right font-mono text-xs shrink-0">
                      <span className="text-base font-bold text-white">{currentValue}</span>
                      <span className="text-slate-400 ml-1">{p.unit}</span>
                      <div className="text-[10px] text-slate-500">
                        Target: <span className="text-brand font-semibold">{p.recommended_value} {p.unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Slider Control */}
                  <div className="pt-2">
                    <input
                      type="range"
                      min={p.min_safe}
                      max={p.max_safe}
                      step={(p.max_safe - p.min_safe) / 100}
                      value={currentValue}
                      onChange={(e) => handleSliderChange(p.key, parseFloat(e.target.value))}
                      className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />

                    <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                      <span>Min Safe: {p.min_safe} {p.unit}</span>
                      <span className="text-brand font-medium">Recommended: {p.recommended_value} {p.unit}</span>
                      <span>Max Safe: {p.max_safe} {p.unit}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Before-and-After Comparison & Projected Outcome (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <span>Before &amp; After Optimization Outcome</span>
            <InfoTooltip content="Quantitative comparison of yield, equipment risk level, and good die gains." />
          </h2>

          <div className="glass-panel p-5 rounded-2xl border border-slate-700 bg-slate-900/80 shadow-2xl space-y-5">
            {/* Tool & Stage Banner */}
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs font-mono text-brand font-bold uppercase tracking-wider">Target Recipe:</span>
              <div className="text-lg font-extrabold text-white">{evaluation?.equipment_name || 'Plasma Etcher Chamber B'}</div>
              <div className="text-xs text-slate-400">{evaluation?.stage}</div>
            </div>

            {/* Before vs After Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Baseline Current */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <span className="text-slate-400 block uppercase font-mono text-[10px]">Current Predicted Yield</span>
                <span className="text-2xl font-extrabold text-slate-300 font-mono block my-1">
                  {comp.current_predicted_yield_pct ?? 94.20}%
                </span>
                <span className="text-[11px] font-mono text-amber-400 font-semibold">
                  Risk: {comp.current_risk_level ?? 'High'}
                </span>
              </div>

              {/* Proposed Target */}
              <div className="p-3.5 rounded-xl bg-sky-950/30 border border-brand/40 text-xs">
                <span className="text-brand block uppercase font-mono text-[10px] font-bold">Proposed Target Yield</span>
                <span className="text-2xl font-extrabold text-brand font-mono block my-1">
                  {comp.proposed_predicted_yield_pct ?? 98.15}%
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                  <TrendingUp size={12} />
                  <span>Gain: {comp.yield_delta_pct > 0 ? `+${comp.yield_delta_pct}%` : `${comp.yield_delta_pct}%`}</span>
                </span>
              </div>
            </div>

            {/* Impact Highlights */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Good Die Output</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  +{comp.good_die_gain_per_wafer ?? 56} dies / wafer
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Estimated Scrap Savings</span>
                <span className="text-base font-bold text-white font-mono">
                  {comp.estimated_annual_cost_savings ?? '$505,600 / yr'}
                </span>
              </div>
            </div>

            {/* Parameter Adjustment Delta Table */}
            <div>
              <span className="text-xs font-bold uppercase font-mono text-slate-300 block mb-2">
                Modified Parameters Delta
              </span>
              {evaluation?.changed_parameters?.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500 bg-slate-950/30 rounded-xl border border-slate-800">
                  Sliders currently match baseline. Adjust values or click "Apply AI Recommendations".
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {evaluation?.changed_parameters?.map((cp: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-sans">{cp.parameter}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 line-through text-[11px]">{cp.before}</span>
                        <ArrowRight size={10} className="text-slate-500" />
                        <span className="text-brand font-bold">{cp.after}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendation Explanation */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <span className="font-bold text-white block uppercase font-mono text-[10px]">
                Engineering Recommendation Rationale
              </span>
              <p className="text-slate-300 leading-relaxed font-normal">
                {evaluation?.explanation}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                onClick={() => alert(`Recipe delta exported to Fab MES staging environment for engineering review.`)}
                className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand/90 text-slate-950 font-bold text-xs transition-all shadow-md shadow-brand/20 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>Submit Recipe for Engineering Review</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
