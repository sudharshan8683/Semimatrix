import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Cpu, 
  LineChart, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Sliders, 
  Layers, 
  Zap, 
  ShieldAlert, 
  Activity, 
  FileSpreadsheet, 
  RefreshCw,
  Search
} from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts'
import { SecomPredictor } from '../analytics/SecomPredictor'

const cpkTrendData = [
  { batch: 'Lot-881', cpk: 1.62, target: 1.33 },
  { batch: 'Lot-882', cpk: 1.58, target: 1.33 },
  { batch: 'Lot-883', cpk: 1.69, target: 1.33 },
  { batch: 'Lot-884', cpk: 1.51, target: 1.33 },
  { batch: 'Lot-885', cpk: 1.74, target: 1.33 },
  { batch: 'Lot-886', cpk: 1.67, target: 1.33 },
]

const defectClassDistribution = [
  { type: 'Micro-Particles', count: 184, fill: '#38BDF8' },
  { type: 'Litho Misalign', count: 62, fill: '#F59E0B' },
  { type: 'Film Scratch', count: 28, fill: '#EC4899' },
  { type: 'Oxide Pinholes', count: 14, fill: '#10B981' },
]

export const QualityEngineerDashboard: React.FC = () => {
  const [feedback, setFeedback] = useState<string | null>(null)
  const [lotStatus, setLotStatus] = useState<Record<string, 'NORMAL' | 'HELD' | 'INSPECTING'>>({
    'LOT-9921': 'NORMAL',
    'LOT-9922': 'NORMAL',
    'LOT-9923': 'HELD',
    'LOT-9924': 'NORMAL'
  })

  const notify = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleHoldLot = (lotId: string) => {
    setLotStatus(prev => ({
      ...prev,
      [lotId]: prev[lotId] === 'HELD' ? 'NORMAL' : 'HELD'
    }))
    notify(`[QUALITY] ${lotId} status updated: ${lotStatus[lotId] === 'HELD' ? 'RELEASED to WIP' : 'QUARANTINED (Hold)'}`)
  }

  const handleTriggerMetrologyRun = () => {
    notify('[SPC] Metrology automated defect scan initiated on cassette carousel #4.')
  }

  const handleExportQualityReport = () => {
    notify('[REPORT] Generated SEMI E142 Defect Map & SPC Cpk Compliance PDF.')
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md uppercase">
              Quality Engineer Portal
            </span>
            <span className="text-xs text-text-muted">| Defect Metrology, SPC & SECOM Machine Learning</span>
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">
            Quality & Yield Assurance
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Real-time wafer defect classification, 590-channel SECOM ML inference, process capability (Cpk), and excursion control.
          </p>
        </div>

        {/* Quality actions header bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleTriggerMetrologyRun}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            <span>Run Metrology Scan</span>
          </button>
          <button
            onClick={handleExportQualityReport}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet size={13} />
            <span>Export SPC Report</span>
          </button>
        </div>
      </div>

      {/* Floating feedback alert */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-sm font-mono flex items-center justify-between shadow-lg shadow-emerald-950/50 backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{feedback}</span>
            </div>
            <button 
              onClick={() => setFeedback(null)}
              className="text-emerald-400 hover:text-white text-xs px-2 py-0.5 rounded"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quality Core KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono uppercase text-text-muted">Process Capability (Cpk)</span>
            <Activity size={18} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-300 font-mono">1.67</div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <span>Six-Sigma capable (&gt; 1.33 spec)</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono uppercase text-text-muted">Defect Density (PPM)</span>
            <Cpu size={18} className="text-brand" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">218 <span className="text-sm font-normal text-text-muted">ppm</span></div>
          <div className="text-xs text-text-muted mt-1 font-mono">SECOM Inferred defect rate: 6.6%</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono uppercase text-text-muted">Active Excursion Alarms</span>
            <ShieldAlert size={18} className="text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-rose-300 font-mono">1 <span className="text-sm font-normal text-text-muted">lot held</span></div>
          <div className="text-xs text-rose-400 mt-1 font-mono">Lot-9923 (Etch CD Drift)</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono uppercase text-text-muted">First Pass Yield</span>
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">96.8%</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Target: 95.0% achieved</div>
        </div>
      </div>

      {/* Embedded SECOM Machine Learning Inference Center */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu size={22} className="text-brand" />
              SECOM Semiconductor Machine Learning Inference Studio
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Live Python FastAPI endpoint executing trained Random Forest model (50 selected features from 590 raw fab sensors).
            </p>
          </div>
        </div>

        {/* Embedded actual predictor card */}
        <SecomPredictor />
      </div>

      {/* Statistical Process Control & Lot Quarantines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cpk 6-Sigma Trend Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <LineChart size={18} className="text-emerald-400" />
                Process Capability (Cpk) Lot History
              </h2>
              <p className="text-xs text-text-muted">Critical dimension control across recent 300mm wafer lots</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Target Cpk ≥ 1.33
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpkTrendData}>
                <defs>
                  <linearGradient id="colorCpk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="batch" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[1.2, 1.9]} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="cpk" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorCpk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Classification Pareto */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers size={18} className="text-brand" />
                Defect Classification Pareto
              </h2>
              <p className="text-xs text-text-muted">Automated optical inspection (AOI) defect categorization</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defectClassDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="type" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#38BDF8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lot Disposition & Quarantine Table (Quality Engineer Web Work) */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert size={20} className="text-amber-400" />
              Wafer Lot Quality Disposition & Quarantine Controls
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Hold or release suspect wafer lots from fabrication line to prevent scrap propagation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'LOT-9921', product: '7nm FinFET ASIC', waferCount: 25, failRate: '0.8%', stage: 'Post-CMP Metal 1' },
            { id: 'LOT-9922', product: '5nm Mobile SoC', waferCount: 25, failRate: '1.2%', stage: 'Gate Etch Complete' },
            { id: 'LOT-9923', product: '12nm Power Reg', waferCount: 25, failRate: '8.4%', stage: 'Ion Implantation' },
            { id: 'LOT-9924', product: 'Memory DDR5 Die', waferCount: 25, failRate: '0.4%', stage: 'Passivation Layer' },
          ].map((lot) => {
            const isHeld = lotStatus[lot.id] === 'HELD'
            return (
              <div 
                key={lot.id}
                className={`p-4 rounded-xl border transition-all ${
                  isHeld 
                    ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/30' 
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-sm text-white">{lot.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isHeld 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse' 
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {isHeld ? 'QUARANTINED' : 'CLEARED WIP'}
                  </span>
                </div>

                <div className="text-xs text-text-secondary font-mono mb-1">{lot.product}</div>
                <div className="text-[11px] text-text-muted mb-3 space-y-0.5">
                  <div>Wafers: <strong className="text-white">{lot.waferCount}</strong> · Fail Rate: <strong className={isHeld ? 'text-rose-400' : 'text-emerald-400'}>{lot.failRate}</strong></div>
                  <div>Stage: <strong className="text-white">{lot.stage}</strong></div>
                </div>

                <button
                  onClick={() => handleHoldLot(lot.id)}
                  className={`w-full py-1.5 px-3 rounded-lg font-mono text-xs font-semibold transition-all ${
                    isHeld
                      ? 'bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {isHeld ? '✓ Release Lot to WIP' : '⚠ Quarantine / Hold Lot'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
