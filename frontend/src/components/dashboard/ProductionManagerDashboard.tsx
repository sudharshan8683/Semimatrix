import React from 'react'
import { motion } from 'framer-motion'
import { 
  Factory, 
  Target, 
  TrendingUp, 
  AlertOctagon, 
  Layers, 
  CheckCircle, 
  Clock, 
  PieChart, 
  ArrowUpRight,
  Boxes
} from 'lucide-react'
import { useSimulationStore } from '../../store/simulationStore'
import { AnimatedCounter } from '../AnimatedCounter'

export const ProductionManagerDashboard: React.FC = () => {
  const { kpis } = useSimulationStore()

  // Wafer output metrics
  const targetWafers = 10000000
  const producedWafers = kpis?.good_wafers ?? 8959753
  const completionPct = Math.min(Math.round((producedWafers / targetWafers) * 100), 100)
  const lostWafers = kpis?.lost_wafers ?? 720
  const estimatedScrapCost = (lostWafers * 45).toLocaleString()

  // Process Stage Flow Throughput
  const stageThroughput = [
    { stage: 'Wafer Prep', throughput: '99.4%', status: 'Optimal', delay: 'None' },
    { stage: 'Photolithography', throughput: '92.1%', status: 'Pacing / Constrained', delay: '+12m' },
    { stage: 'Etching', throughput: '96.8%', status: 'Optimal', delay: 'None' },
    { stage: 'Ion Implantation', throughput: '95.2%', status: 'Active Lot', delay: '+4m' },
    { stage: 'Metallization', throughput: '98.5%', status: 'Optimal', delay: 'None' },
    { stage: 'Inspection & Test', throughput: '99.1%', status: 'Optimal', delay: 'None' },
  ]

  // Active cleanroom batch lots
  const activeBatches = [
    { id: 'B-2026-0011', family: 'Logic (5nm)', lotSize: 25, stage: 'Photolithography', status: 'IN_PROCESS', priority: 'HIGH' },
    { id: 'B-2026-0010', family: 'Memory (DRAM)', lotSize: 25, stage: 'Etching', status: 'IN_PROCESS', priority: 'NORMAL' },
    { id: 'B-2026-0009', family: 'Power (SiC)', lotSize: 25, stage: 'Ion Implantation', status: 'IN_PROCESS', priority: 'NORMAL' },
    { id: 'B-2026-0008', family: 'Analog (RF)', lotSize: 25, stage: 'Metallization', status: 'IN_PROCESS', priority: 'HIGH' },
    { id: 'B-2026-0007', family: 'Logic (3nm)', lotSize: 25, stage: 'Testing', status: 'COMPLETING', priority: 'CRITICAL' },
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md uppercase">
              Production Manager
            </span>
            <span className="text-xs text-text-muted">| Manufacturing Execution & Throughput</span>
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">
            Wafer Fab Production Command
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Real-time wafer throughput, batch flow progression, and stage capacity monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface/50 border border-white/10 text-xs font-mono">
          <Clock size={16} className="text-brand" />
          <span className="text-text-secondary">Shift 1 (Day):</span>
          <span className="text-emerald-400 font-bold">On Schedule</span>
        </div>
      </div>

      {/* Top Production KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Target vs Actual */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Target Completion</span>
            <div className="p-2 rounded-xl bg-brand/10 text-brand">
              <Target size={18} />
            </div>
          </div>
          <div className="text-3xl font-light font-mono text-white mb-2">
            {completionPct}%
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden mb-2 border border-white/5">
            <div className="h-full bg-gradient-to-r from-brand to-brand-accent rounded-full" style={{ width: `${completionPct}%` }} />
          </div>
          <div className="text-[11px] text-text-muted flex justify-between font-mono">
            <span>{producedWafers.toLocaleString()} actual</span>
            <span>{targetWafers.toLocaleString()} goal</span>
          </div>
        </div>

        {/* Current Fab Yield */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Cleanroom Yield</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-3xl font-light font-mono text-white mb-1">
            <AnimatedCounter value={kpis?.yield ?? 98.6} format="percent" />
          </div>
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-2">
            <ArrowUpRight size={14} /> +0.8% above quarterly fab target
          </div>
        </div>

        {/* Fleet Utilization */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Tool Utilization</span>
            <div className="p-2 rounded-xl bg-white/5 text-brand">
              <Factory size={18} />
            </div>
          </div>
          <div className="text-3xl font-light font-mono text-white mb-1">
            <AnimatedCounter value={kpis?.utilization ?? 45.8} format="percent" />
          </div>
          <div className="text-xs text-text-muted mt-2">
            24 active manufacturing bays online
          </div>
        </div>

        {/* Scrap Impact */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Potential Scrap</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <AlertOctagon size={18} />
            </div>
          </div>
          <div className="text-3xl font-light font-mono text-red-400 mb-1">
            {lostWafers} <span className="text-xs text-text-muted font-sans">wafers</span>
          </div>
          <div className="text-xs text-text-muted mt-2 font-mono">
            Est. scrap value: ~${estimatedScrapCost}
          </div>
        </div>
      </div>

      {/* Process Stage Bottleneck & Throughput */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Layers size={18} className="text-brand" />
          Process Stage Flow & Stage Health
        </h2>
        <p className="text-xs text-text-secondary mb-6">
          Real-time pacing and throughput rates across primary manufacturing bay stages.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stageThroughput.map((stg, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-white">{stg.stage}</span>
                <span className="font-mono text-xs font-bold text-brand">{stg.throughput}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                  stg.status === 'Optimal' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {stg.status}
                </span>
                <span className="text-text-muted font-mono">{stg.delay}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Batches Table */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Boxes size={18} className="text-brand-accent" />
            Active Wafer Batches (WIP)
          </h2>
          <span className="text-xs text-text-muted font-mono">5 Batches in-flight</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-text-secondary text-xs uppercase tracking-widest font-mono">
                <th className="pb-4 pl-4">Batch ID</th>
                <th className="pb-4">Product Family</th>
                <th className="pb-4">Lot Size</th>
                <th className="pb-4">Current Bay / Stage</th>
                <th className="pb-4">Priority</th>
                <th className="pb-4 pr-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeBatches.map((b) => (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 pl-4 font-mono font-bold text-brand">{b.id}</td>
                  <td className="py-4 text-white font-medium">{b.family}</td>
                  <td className="py-4 font-mono text-text-secondary">{b.lotSize} Wafers</td>
                  <td className="py-4 text-text-secondary">{b.stage}</td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      b.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-300' :
                      b.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-text-secondary'
                    }`}>
                      {b.priority}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
