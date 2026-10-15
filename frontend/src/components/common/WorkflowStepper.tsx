import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  Search, 
  Cpu, 
  HelpCircle, 
  CheckCircle2, 
  Sliders, 
  ArrowRight, 
  X, 
  Sparkles,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface WorkflowStep {
  id: string
  title: string
  subtitle: string
  icon: any
  color: string
  borderColor: string
  description: string
  actionLabel: string
  actionRoute: string
  scenarioData: {
    tool: string
    finding: string
    evidence: string
    recommendation: string
    outcome: string
  }
}

const steps: WorkflowStep[] = [
  {
    id: 'MONITOR',
    title: '1. Monitor',
    subtitle: 'Real-time telemetry ingestion',
    icon: Activity,
    color: 'text-sky-400',
    borderColor: 'border-sky-500/30 bg-sky-500/10',
    description: 'Continuously stream temperature, pressure, vibration, and gas flow rates across all cleanroom fabrication bays.',
    actionLabel: 'Go to Equipment Monitoring',
    actionRoute: '/equipment',
    scenarioData: {
      tool: 'ETCH-02 (Plasma Etcher Chamber B)',
      finding: 'Telemetry readings streaming every 2 seconds via digital twin link.',
      evidence: 'Nominal baseline: Pressure 2.15 Torr, Temp 78.5°C, Vibration 1.4 mm/s.',
      recommendation: 'Continuous multi-channel monitoring in place.',
      outcome: 'No human intervention needed during baseline operations.'
    }
  },
  {
    id: 'DETECT',
    title: '2. Detect',
    subtitle: 'Out-of-control anomaly recognition',
    icon: Search,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30 bg-amber-500/10',
    description: 'Instant statistical process control (SPC) and z-score tripwire flagging when sensors diverge from safe operating boundaries.',
    actionLabel: 'View Active Alerts',
    actionRoute: '/alerts',
    scenarioData: {
      tool: 'ETCH-02',
      finding: 'Chamber vacuum pressure drifted up to 3.42 Torr (+48% deviation).',
      evidence: 'Normal limit is 1.20 - 2.80 Torr. Triggered active CRITICAL alert ALT-0001.',
      recommendation: 'Quarantine tool from lot dispatch until cause is verified.',
      outcome: 'Immediate detection prevents processing wafers under bad vacuum.'
    }
  },
  {
    id: 'PREDICT',
    title: '3. Predict',
    subtitle: 'Failure probability & defect risk',
    icon: Cpu,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30 bg-purple-500/10',
    description: 'Evaluate degradation curve and SECOM Random Forest defect model to forecast failure horizon and wafer scrap risk.',
    actionLabel: 'Inspect Failure Risk',
    actionRoute: '/predictive-maintenance',
    scenarioData: {
      tool: 'ETCH-02 & Wafer Lot B-2026-0004',
      finding: 'Failure risk calculated at 86.4/100 (Critical). Predicted scrap rate: 5.8%.',
      evidence: 'Prediction horizon: 18 - 36 operating hours before turbo-exhaust seal failure.',
      recommendation: 'Execute predictive maintenance before catastrophic line stoppage.',
      outcome: 'Converts unexpected crash into a planned 45-minute repair.'
    }
  },
  {
    id: 'EXPLAIN',
    title: '4. Explain',
    subtitle: 'Transparent root cause breakdown',
    icon: HelpCircle,
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/30 bg-indigo-500/10',
    description: 'Unpack the AI and rule-based drivers: show exact sensor contributions, control limit deltas, and physical equipment causes.',
    actionLabel: 'Read Model Explanation',
    actionRoute: '/predictive-maintenance',
    scenarioData: {
      tool: 'ETCH-02',
      finding: 'Root cause identified: Throttle exhaust conductance valve diaphragm degradation.',
      evidence: 'Top factor: Pressure gradient accounts for 42% of risk weight. Vibration harmonics at 35%.',
      recommendation: 'Inspect O-ring seal ring and valve actuator rather than entire turbopump.',
      outcome: 'Zero guesswork; technicians know exactly which component is failing.'
    }
  },
  {
    id: 'RECOMMEND',
    title: '5. Recommend',
    subtitle: 'Actionable engineering guidance',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30 bg-emerald-500/10',
    description: 'Generate specific maintenance work orders, part numbers, and standard operating procedures (SOP) with human approval.',
    actionLabel: 'Review Work Orders',
    actionRoute: '/alerts',
    scenarioData: {
      tool: 'ETCH-02',
      finding: 'Work order TKT-892 dispatched to Lead Maintenance Engineer Elena Rostova.',
      evidence: 'Required parts: ISO-KF25 O-ring kit, exhaust diaphragm gasket.',
      recommendation: 'Perform 45-min seal swap during upcoming scheduled lot transition.',
      outcome: 'Downtime scheduled with zero lost wafer yield.'
    }
  },
  {
    id: 'OPTIMIZE',
    title: '6. Optimize',
    subtitle: 'Process recipe fine-tuning & yield gain',
    icon: Sliders,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30 bg-cyan-500/10',
    description: 'Simulate recipe parameter adjustments (RF power, chamber pressure, gas ratio) to maximize good dies per wafer.',
    actionLabel: 'Open Process Optimizer',
    actionRoute: '/optimization',
    scenarioData: {
      tool: 'ETCH-02',
      finding: 'Simulated parameter adjustment: Lower RF Bias (520W -> 460W) and reset Pressure (2.15 Torr).',
      evidence: 'Projected yield gain: 94.2% -> 98.15% (+3.95% wafer yield gain).',
      recommendation: 'Deploy optimized recipe to secondary chamber for engineering qualification.',
      outcome: 'Achieves +56 good dies per wafer and prevents $128,000 in monthly scrap.'
    }
  }
]

export const WorkflowStepper: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0)
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const activeStep = steps[activeStepIndex]

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-700/60 bg-slate-900/40 relative overflow-hidden">
      {/* Header with Title and Walkthrough Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-brand animate-ping"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand">
              End-to-End Fab Intelligence Workflow
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-0.5">
            MONITOR → DETECT → PREDICT → EXPLAIN → RECOMMEND → OPTIMIZE
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Click any step to inspect how raw cleanroom sensor telemetry translates into actionable maintenance and yield gain.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand text-xs font-bold transition-all flex items-center gap-1.5 self-start md:self-auto shadow-sm"
        >
          <Sparkles size={14} />
          <span>Interactive Scenario Walkthrough</span>
        </button>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {steps.map((s, idx) => {
          const Icon = s.icon
          const isSelected = idx === activeStepIndex
          return (
            <button
              key={s.id}
              onClick={() => setActiveStepIndex(idx)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? `${s.borderColor} shadow-md scale-[1.02] border-brand/60`
                  : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon size={16} className={isSelected ? s.color : 'text-slate-500'} />
                <span className="text-[10px] font-mono text-slate-500 font-bold">0{idx + 1}</span>
              </div>
              <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                {s.title.split('. ')[1]}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {s.subtitle}
              </div>
            </button>
          )
        })}
      </div>

      {/* Active Step Quick Card */}
      <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase font-mono px-2 py-0.5 rounded ${activeStep.borderColor} ${activeStep.color}`}>
              {activeStep.title}
            </span>
            <span className="text-xs text-slate-400">{activeStep.description}</span>
          </div>
          <div className="text-xs text-slate-300 pt-1 flex flex-wrap gap-x-4 gap-y-1">
            <span><strong className="text-white">Example Tool:</strong> {activeStep.scenarioData.tool}</span>
            <span><strong className="text-white">Action:</strong> {activeStep.scenarioData.finding}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={activeStep.actionRoute}
            className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all flex items-center gap-1.5 border border-white/10"
          >
            <span>{activeStep.actionLabel}</span>
            <ExternalLink size={12} />
          </Link>
          {activeStepIndex < steps.length - 1 && (
            <button
              onClick={() => setActiveStepIndex(prev => prev + 1)}
              className="p-1.5 rounded-lg bg-brand/20 hover:bg-brand/30 text-brand text-xs transition-all"
              title="Next step"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Full Modal Walkthrough */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel p-6 rounded-2xl w-full max-w-2xl border border-slate-700 bg-slate-900 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-brand/20 text-brand">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Full Industrial Scenario Walkthrough</h3>
                    <p className="text-xs text-slate-400">Step-by-step resolution of an actual fab excursion on Plasma Etcher ETCH-02</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {steps.map((st, i) => (
                  <div 
                    key={st.id} 
                    className={`p-4 rounded-xl border ${st.borderColor} transition-all`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-mono font-bold uppercase ${st.color}`}>
                        {st.title}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-semibold">{st.scenarioData.tool}</span>
                    </div>
                    <div className="text-sm font-semibold text-white mb-2">{st.scenarioData.finding}</div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-slate-400 block font-mono text-[10px] uppercase">Telemetry Evidence</span>
                        <span className="text-slate-200">{st.scenarioData.evidence}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono text-[10px] uppercase">Engineering Recommendation</span>
                        <span className="text-slate-200">{st.scenarioData.recommendation}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 size={13} />
                      <span><strong>Fab Outcome:</strong> {st.scenarioData.outcome}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-brand text-slate-950 font-bold text-xs hover:bg-brand/90 transition-all shadow-md shadow-brand/20"
                >
                  Close Walkthrough
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
