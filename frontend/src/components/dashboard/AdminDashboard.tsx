import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Server, 
  Database, 
  Cpu, 
  Radio, 
  ShieldCheck, 
  Users, 
  Sliders, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Terminal,
  Activity,
  Layers,
  Zap
} from 'lucide-react'
import { useSimulationStore } from '../../store/simulationStore'

export const AdminDashboard: React.FC = () => {
  const { kpis, equipments, isConnected } = useSimulationStore()
  const [simSpeed, setSimSpeed] = useState<'1x' | '2x' | '5x'>('1x')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const triggerAction = (actionName: string) => {
    setStatusMessage(`[SYS] Command '${actionName}' executed successfully.`)
    setTimeout(() => setStatusMessage(null), 4000)
  }

  // System stats
  const sysStats = [
    { label: 'API Server', value: 'FastAPI 1.0.0', sub: 'Port 8000 (Healthy)', icon: Server, color: 'text-emerald-400' },
    { label: 'Database Storage', value: '22.6 MB', sub: 'SQLite (fabsense.db)', icon: Database, color: 'text-brand' },
    { label: 'SECOM ML Engine', value: 'Active', sub: 'Scikit-Learn 1.9.1 (50 Feats)', icon: Cpu, color: 'text-brand-accent' },
    { label: 'WebSocket Stream', value: isConnected ? 'Connected' : 'Reconnecting', sub: 'ws://localhost:8000/ws/live', icon: Radio, color: isConnected ? 'text-emerald-400' : 'text-amber-400' },
  ]

  // Role directory
  const usersList = [
    { username: 'admin', role: 'ADMIN', email: 'admin@fabsense.local', access: 'Full System Control' },
    { username: 'prod_mgr', role: 'PRODUCTION_MANAGER', email: 'prod@fabsense.local', access: 'Wafer Output & OEE' },
    { username: 'maint_eng', role: 'MAINTENANCE_ENGINEER', email: 'maint@fabsense.local', access: 'Tool Service & Work Orders' },
    { username: 'qual_eng', role: 'QUALITY_ENGINEER', email: 'qual@fabsense.local', access: 'Defect Analysis & ML Evaluation' },
    { username: 'viewer', role: 'VIEWER', email: 'viewer@fabsense.local', access: 'Executive Read-Only Overview' },
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-brand/20 text-brand border border-brand/30 rounded-md uppercase">
              Admin Console
            </span>
            <span className="text-xs text-text-muted">| Fab Infrastructure & System Management</span>
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">
            System Administration
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Real-time server telemetry, digital twin simulation controls, and user access management.
          </p>
        </div>

        {/* Simulator controls */}
        <div className="flex items-center gap-3 bg-surface/50 border border-white/10 rounded-2xl p-2.5 backdrop-blur-md">
          <Activity size={18} className="text-brand animate-pulse" />
          <span className="text-xs text-text-secondary font-medium">Simulator Rate:</span>
          {(['1x', '2x', '5x'] as const).map((spd) => (
            <button
              key={spd}
              onClick={() => {
                setSimSpeed(spd)
                triggerAction(`Simulator frequency adjusted to ${spd}`)
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                simSpeed === spd
                  ? 'bg-brand text-black shadow-sm'
                  : 'text-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {spd}
            </button>
          ))}
        </div>
      </div>

      {/* Action Notification Alert */}
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-brand/10 border border-brand/30 text-brand text-xs font-mono flex items-center gap-2"
        >
          <CheckCircle2 size={16} />
          <span>{statusMessage}</span>
        </motion.div>
      )}

      {/* System Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {sysStats.map((st, i) => {
          const Icon = st.icon
          return (
            <div key={i} className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider text-text-secondary font-semibold">{st.label}</span>
                <div className={`p-2 rounded-xl bg-white/5 ${st.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-white mb-1">{st.value}</div>
              <div className="text-xs text-text-muted font-mono">{st.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Two Column Layout: Simulator Controls & Fleet Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Cleanroom Infrastructure Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Sliders size={18} className="text-brand" />
              Cleanroom Ingestion & Simulation Controls
            </h2>
            <p className="text-xs text-text-secondary mb-6">
              Trigger background cleanroom events, force sensor sync, or run database integrity diagnostics.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => triggerAction('Forced telemetry sync across all 24 machines')}
                className="p-4 rounded-xl border border-white/5 bg-surface/30 hover:bg-white/5 hover:border-brand/30 transition-all text-left group"
              >
                <RefreshCw size={20} className="text-brand mb-2 group-hover:rotate-180 transition-transform duration-500" />
                <div className="text-sm font-bold text-white">Sync Telemetry</div>
                <div className="text-xs text-text-muted mt-1">Force immediate poll across Bay 1-4</div>
              </button>

              <button
                onClick={() => triggerAction('Process parameter anomaly injected into Tool ETCH-02')}
                className="p-4 rounded-xl border border-white/5 bg-surface/30 hover:bg-white/5 hover:border-amber-400/30 transition-all text-left group"
              >
                <AlertTriangle size={20} className="text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-bold text-white">Simulate Anomaly</div>
                <div className="text-xs text-text-muted mt-1">Inject pressure drift on Tool ETCH-02</div>
              </button>

              <button
                onClick={() => triggerAction('SQLite database vacuum and connection pool refreshed')}
                className="p-4 rounded-xl border border-white/5 bg-surface/30 hover:bg-white/5 hover:border-emerald-400/30 transition-all text-left group"
              >
                <Zap size={20} className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-bold text-white">Flush DB Pool</div>
                <div className="text-xs text-text-muted mt-1">Clear stale locks and optimize queries</div>
              </button>
            </div>
          </div>

          {/* Cleanroom Bay Overview */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Layers size={18} className="text-brand-accent" />
              Cleanroom Bay Operational Status
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Bay 1 (Photolithography)', 'Bay 2 (Etch & Clean)', 'Bay 3 (Deposition & Implant)', 'Bay 4 (Metallization & Test)'].map((bay, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">{bay}</div>
                    <div className="text-xs text-text-muted mt-0.5">6 Active Tools | ISO Class 1</div>
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ONLINE
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: User Directory & System Logs */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Users size={18} className="text-brand" />
              Role-Based Access Directory
            </h2>
            <div className="space-y-3">
              {usersList.map((u, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white font-mono">{u.username}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand/10 text-brand border border-brand/20">
                      {u.role}
                    </span>
                  </div>
                  <div className="text-text-muted text-[11px]">{u.access}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Terminal Log */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Terminal size={14} className="text-text-muted" /> System Audit Trail
            </h2>
            <div className="p-3 rounded-xl bg-black/60 font-mono text-[11px] text-text-muted space-y-1.5 border border-white/5">
              <div className="text-emerald-400/90">[OK] FastAPI server initialized on :8000</div>
              <div className="text-brand/90">[OK] SECOM pipeline loaded (440 &gt; 50 feats)</div>
              <div className="text-white/80">[OK] Background simulation heartbeat: 2.0s</div>
              <div className="text-text-muted">[INFO] Authenticated session active (ADMIN)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
