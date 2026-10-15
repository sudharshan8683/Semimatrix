import React from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  ShieldCheck, 
  Droplet, 
  Wind, 
  Zap, 
  Award, 
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react'
import { useSimulationStore } from '../../store/simulationStore'
import { AnimatedCounter } from '../AnimatedCounter'

export const ViewerDashboard: React.FC = () => {
  const { kpis } = useSimulationStore()

  // High-level compliance and facility metrics
  const facilityKpis = [
    { label: 'Cleanroom OEE Score', value: kpis?.uptime ?? 100, format: 'percent', note: 'Top-tier semiconductor benchmark', icon: Award, color: 'text-brand' },
    { label: 'Cumulative Yield Rate', value: kpis?.yield ?? 98.6, format: 'percent', note: 'Exceeding 97.5% fab baseline', icon: BarChart3, color: 'text-emerald-400' },
    { label: 'Cleanroom Air Quality', value: 'ISO Class 1', format: 'string', note: '<10 particles/m³ @ 0.1µm', icon: Wind, color: 'text-brand-accent' },
    { label: 'Facility PUE Rating', value: '1.24', format: 'string', note: 'Ultra-low energy efficiency ratio', icon: Zap, color: 'text-amber-300' },
  ]

  const complianceStandards = [
    { title: 'ISO 14644-1 Cleanroom Compliance', status: 'Compliant', date: 'Valid thru 2027', cert: 'Audit Score 99.8%' },
    { title: 'SEMI S2 Environmental Health & Safety', status: 'Active', date: 'Quarterly Verified', cert: 'Zero Violations' },
    { title: 'Ultra-Pure Water (UPW) Closed-Loop Recycling', status: 'Optimal', date: '94.2% Recovery Rate', cert: '18.2 MΩ·cm Resistivity' },
    { title: 'Cleanroom ESD Grounding Grid', status: 'Certified', date: 'Continuous Monitored', cert: '< 1.0 V Surface Potential' },
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-white/10 text-white border border-white/20 rounded-md uppercase">
              Executive Viewer
            </span>
            <span className="text-xs text-text-muted">| Read-Only Fab Health & Compliance Overview</span>
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">
            Executive Fab Intelligence
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Certified operational benchmarks, cleanroom environmental indices, and high-level yield statistics.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400">
          <ShieldCheck size={16} />
          <span>All Cleanroom Standards In Compliance</span>
        </div>
      </div>

      {/* High-Level Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {facilityKpis.map((k, idx) => {
          const Icon = k.icon
          return (
            <div key={idx} className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs uppercase tracking-wider font-semibold text-text-secondary">{k.label}</span>
                <div className={`p-2 rounded-xl bg-white/5 ${k.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="text-3xl font-light font-mono text-white mb-1">
                {k.format === 'percent' ? (
                  <AnimatedCounter value={k.value as number} format="percent" />
                ) : (
                  <span>{k.value}</span>
                )}
              </div>
              <div className="text-xs text-text-muted mt-2 font-sans">{k.note}</div>
            </div>
          )
        })}
      </div>

      {/* Facility Environmental & Sustainability Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Sparkles size={18} className="text-brand" />
            Cleanroom Environmental Stability
          </h2>
          <p className="text-xs text-text-secondary mb-6">
            Atmospheric parameters across 4 micro-climate processing zones.
          </p>

          <div className="space-y-4">
            {[
              { zone: 'Bay 1: Photolithography Zone', temp: '20.0 °C (±0.05)', humidity: '42.0% RH', particles: '0.4 /m³' },
              { zone: 'Bay 2: Chemical Etching & Cleaning', temp: '21.5 °C (±0.1)', humidity: '40.5% RH', particles: '1.2 /m³' },
              { zone: 'Bay 3: Thin Film Deposition', temp: '22.0 °C (±0.1)', humidity: '38.0% RH', particles: '0.8 /m³' },
              { zone: 'Bay 4: Metallization & Metrology', temp: '20.5 °C (±0.05)', humidity: '41.0% RH', particles: '0.5 /m³' },
            ].map((z, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                <span className="font-bold text-white">{z.zone}</span>
                <div className="flex gap-4 font-mono text-text-secondary">
                  <span>Temp: <strong className="text-brand">{z.temp}</strong></span>
                  <span>RH: <strong className="text-white">{z.humidity}</strong></span>
                  <span>Particles: <strong className="text-emerald-400">{z.particles}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cleanroom Standards & Safety Audit */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            Certifications & Governance
          </h2>
          <p className="text-xs text-text-secondary mb-6">
            Third-party audit certifications and continuous safety compliance.
          </p>

          <div className="space-y-3">
            {complianceStandards.map((c, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{c.title}</div>
                  <div className="text-[11px] text-text-muted mt-0.5 flex gap-2 font-mono">
                    <span>{c.date}</span>
                    <span>•</span>
                    <span className="text-brand">{c.cert}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
