import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Settings, 
  Activity, 
  Gauge, 
  Calendar, 
  Zap, 
  Terminal, 
  Check, 
  Send,
  Cpu,
  RefreshCw
} from 'lucide-react'
import { useSimulationStore } from '../../store/simulationStore'
import { useNavigate } from 'react-router-dom'

interface MaintenanceOrder {
  id: string
  tool: string
  bay: string
  issue: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  engineer: string
  eta: string
}

export const MaintenanceEngineerDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { equipments, isConnected } = useSimulationStore()
  
  const [orders, setOrders] = useState<MaintenanceOrder[]>([
    { id: 'WO-4011', tool: 'Etch Chamber 4 (Dry Plasma)', bay: 'Bay 2 - Dry Etch', issue: 'RF Generator impedance mismatch > 4.2%', priority: 'CRITICAL', status: 'IN_PROGRESS', engineer: 'Alex Miller (Lead)', eta: '45 mins' },
    { id: 'WO-4012', tool: 'EUV Litho Scanner 3', bay: 'Bay 1 - Photolithography', issue: 'Laser droplet collector thermal drift +0.3°C', priority: 'HIGH', status: 'PENDING', engineer: 'Sarah Kim', eta: '2 hours' },
    { id: 'WO-4013', tool: 'LPCVD Reactor 2', bay: 'Bay 3 - Thin Film Deposition', issue: 'Quartz tube precursor deposit buildup', priority: 'MEDIUM', status: 'PENDING', engineer: 'Unassigned', eta: '5 hours' },
    { id: 'WO-4014', tool: 'CMP Polisher 1', bay: 'Bay 4 - Chemical Mechanical Polish', issue: 'Slurry delivery nozzle pressure fluctuation', priority: 'LOW', status: 'COMPLETED', engineer: 'David Rodriguez', eta: 'Done' }
  ])

  const [activeLog, setActiveLog] = useState<string[]>([
    '[08:30:12] Maint Eng signed in to Cleanroom Bay Terminal.',
    '[09:15:44] WO-4011 RF Match diagnostic initiated on Etch 4.',
    '[10:02:19] Routine helium backside leak rate verified at 0.01 sccm.',
    '[10:45:00] Automated chamber bakeout completed for CVD 2.'
  ])

  const [statusNotification, setStatusNotification] = useState<string | null>(null)
  const [calibratingTool, setCalibratingTool] = useState<string | null>(null)

  const showNotification = (msg: string) => {
    setStatusNotification(msg)
    setActiveLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 10)])
    setTimeout(() => setStatusNotification(null), 4000)
  }

  const handleUpdateStatus = (id: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
    showNotification(`Work Order ${id} updated to ${newStatus}`)
  }

  const handleRunChamberDiagnostic = (toolName: string) => {
    setCalibratingTool(toolName)
    showNotification(`Running deep sensor diagnostics on ${toolName}...`)
    setTimeout(() => {
      setCalibratingTool(null)
      showNotification(`✓ Diagnostic finished for ${toolName}: Chamber pressure & RF baseline within SEMI E10 spec.`)
    }, 2500)
  }

  const handlePurgeGas = (toolName: string) => {
    showNotification(`Initiated high-purity N2 purge cycle for ${toolName}. Duration: 3 min.`)
  }

  const handleAcknowledgeFault = (toolName: string) => {
    showNotification(`Maintenance fault acknowledged for ${toolName}. Logged to fab record.`)
  }

  // Tool telemetry status
  const toolTelemetry = [
    { name: 'Plasma Etcher 4', chamberPress: '12.4 mTorr', rfPower: '1420 W', heLeak: '0.02 sccm', chuckTemp: '20.1 °C', health: 74, status: 'Service Req.' },
    { name: 'EUV Litho 3', chamberPress: 'High Vac', rfPower: '250 W', heLeak: '0.00 sccm', chuckTemp: '21.0 °C', health: 86, status: 'Drift Detected' },
    { name: 'LPCVD Furnace 2', chamberPress: '450 mTorr', rfPower: 'N/A', heLeak: '0.01 sccm', chuckTemp: '680.4 °C', health: 91, status: 'Stable' },
    { name: 'CMP Polisher 1', chamberPress: 'Atmospheric', rfPower: 'N/A', heLeak: '0.00 sccm', chuckTemp: '22.3 °C', health: 98, status: 'Optimal' },
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md uppercase">
              Maintenance Engineer Portal
            </span>
            <span className="text-xs text-text-muted">| Fab Tool Servicing, Diagnostics & Work Orders</span>
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">
            Equipment Maintenance Command
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Real-time tool telemetry, preventive maintenance schedules, and active repair dispatching for semiconductor tool bays.
          </p>
        </div>

        {/* Quick status pill */}
        <div className="flex items-center gap-3">
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-ping" />
            <div>
              <div className="text-[10px] font-mono text-text-muted uppercase">Duty Status</div>
              <div className="text-xs font-bold text-white">Active Shift (On-Call Fab Bays 1-4)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating feedback alert */}
      <AnimatePresence>
        {statusNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-200 text-sm font-mono flex items-center justify-between shadow-lg shadow-blue-950/50 backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
              <span>{statusNotification}</span>
            </div>
            <button 
              onClick={() => setStatusNotification(null)}
              className="text-blue-400 hover:text-white text-xs px-2 py-0.5 rounded"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Highlights for Maintenance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono uppercase text-text-muted">Mean Time To Repair</span>
            <Clock size={18} className="text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">1.8 <span className="text-sm font-normal text-text-muted">hrs</span></div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <span>↓ 22% faster vs fab baseline</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono uppercase text-text-muted">Mean Time Betw. Failures</span>
            <Activity size={18} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">248 <span className="text-sm font-normal text-text-muted">hrs</span></div>
          <div className="text-xs text-text-muted mt-1 font-mono">Target: 240 hrs MTBF</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono uppercase text-text-muted">Active Work Orders</span>
            <Wrench size={18} className="text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-300 font-mono">
            {orders.filter(o => o.status !== 'COMPLETED').length} <span className="text-sm font-normal text-text-muted">tickets</span>
          </div>
          <div className="text-xs text-amber-400/80 mt-1 font-mono">1 Critical, 1 High, 1 Med</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono uppercase text-text-muted">Chamber Calibrations Due</span>
            <Gauge size={18} className="text-brand" />
          </div>
          <div className="text-3xl font-extrabold text-brand font-mono">2 <span className="text-sm font-normal text-text-muted">tools</span></div>
          <div className="text-xs text-text-muted mt-1 font-mono">Next: Etch Bay in 4 hrs</div>
        </div>
      </div>

      {/* Main Work Area: Active Work Orders (Interactive Web Work) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wrench size={20} className="text-blue-400" />
                  Active Tool Work Orders & Repair Queue
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Update work orders, assign technicians, or sign off on completed maintenance directly from the web.
                </p>
              </div>
              <button 
                onClick={() => navigate('/maintenance')}
                className="text-xs font-mono px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 text-text-secondary hover:text-white transition-all"
              >
                View Full Queue →
              </button>
            </div>

            <div className="space-y-3.5">
              {orders.map((order) => (
                <div 
                  key={order.id}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-400">{order.id}</span>
                      <span className="text-xs text-text-muted">|</span>
                      <span className="font-bold text-white text-sm">{order.tool}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        order.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        order.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {order.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        order.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' :
                        order.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-white/10 text-text-muted'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="text-xs text-text-secondary font-mono">
                      <span className="text-text-muted">Issue:</span> {order.issue}
                    </div>

                    <div className="text-[11px] text-text-muted flex items-center gap-4">
                      <span>Location: <strong className="text-white">{order.bay}</strong></span>
                      <span>Assigned: <strong className="text-white">{order.engineer}</strong></span>
                      <span>ETA: <strong className="text-white">{order.eta}</strong></span>
                    </div>
                  </div>

                  {/* Web-based interactive actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {order.status !== 'IN_PROGRESS' && order.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'IN_PROGRESS')}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 text-xs font-mono font-semibold transition-all flex items-center gap-1"
                      >
                        <Wrench size={13} /> Take Ticket
                      </button>
                    )}
                    {order.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 text-xs font-mono font-semibold transition-all flex items-center gap-1"
                      >
                        <Check size={13} /> Complete
                      </button>
                    )}
                    {order.status === 'COMPLETED' && (
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Closed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Tool Telemetry & Diagnostic Controls */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Gauge size={20} className="text-emerald-400" />
              Tool Telemetry & Subsystem Diagnostics
            </h2>
            <p className="text-xs text-text-muted mb-4">
              Real sensor readouts across etch chambers, photolithography steppers, and CVD reactors. Trigger direct chamber actions on the web.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {toolTelemetry.map((tool, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{tool.name}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      tool.health < 80 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {tool.status} ({tool.health}%)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-black/30 p-2 rounded-lg">
                      <div className="text-[10px] text-text-muted">Chamber Press</div>
                      <div className="text-white font-bold">{tool.chamberPress}</div>
                    </div>
                    <div className="bg-black/30 p-2 rounded-lg">
                      <div className="text-[10px] text-text-muted">RF Power</div>
                      <div className="text-white font-bold">{tool.rfPower}</div>
                    </div>
                    <div className="bg-black/30 p-2 rounded-lg">
                      <div className="text-[10px] text-text-muted">He Backside</div>
                      <div className="text-white font-bold">{tool.heLeak}</div>
                    </div>
                    <div className="bg-black/30 p-2 rounded-lg">
                      <div className="text-[10px] text-text-muted">Chuck Temp</div>
                      <div className="text-white font-bold">{tool.chuckTemp}</div>
                    </div>
                  </div>

                  {/* Web actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      disabled={calibratingTool === tool.name}
                      onClick={() => handleRunChamberDiagnostic(tool.name)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {calibratingTool === tool.name ? (
                        <RefreshCw size={12} className="animate-spin text-blue-400" />
                      ) : (
                        <Activity size={12} className="text-blue-400" />
                      )}
                      <span>{calibratingTool === tool.name ? 'Diagnosing...' : 'Diagnostics'}</span>
                    </button>
                    <button
                      onClick={() => handlePurgeGas(tool.name)}
                      className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-text-secondary hover:text-white transition-all"
                    >
                      N2 Purge
                    </button>
                    <button
                      onClick={() => handleAcknowledgeFault(tool.name)}
                      className="py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-[11px] font-mono text-amber-300 transition-all"
                    >
                      Ack
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column: PM Calendar & Engineer Activity Log */}
        <div className="space-y-6">
          {/* Preventive Maintenance Schedule */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h2 className="text-md font-bold text-white mb-3 flex items-center gap-2">
              <Calendar size={18} className="text-brand" />
              Scheduled PM Timeline
            </h2>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex justify-between items-center text-brand font-bold">
                  <span>RF Match Recalibration</span>
                  <span>In 4 hrs</span>
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">Etch Tool 4 · 500-wafer PM cycle</div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex justify-between items-center text-white font-bold">
                  <span>Target Sputter Erosion Inspect</span>
                  <span>In 14 hrs</span>
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">PVD Metal Sputter 1 · Physical thickness check</div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex justify-between items-center text-white font-bold">
                  <span>Quartz Chamber Scrub & Bakeout</span>
                  <span>In 28 hrs</span>
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">LPCVD Tube 2 · Standard chemical wipe</div>
              </div>
            </div>
          </div>

          {/* Live Maintenance Terminal Log */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-md font-bold text-white flex items-center gap-2">
                <Terminal size={18} className="text-blue-400" />
                Engineer Service Log
              </h2>
              <span className="text-[10px] font-mono text-text-muted uppercase">Live Audit</span>
            </div>
            
            <div className="p-3 rounded-xl bg-black/50 border border-white/5 font-mono text-[11px] text-text-secondary space-y-2 h-64 overflow-y-auto">
              {activeLog.map((log, idx) => (
                <div key={idx} className="leading-relaxed border-b border-white/5 pb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Nav to Floor Map */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900/30 to-indigo-900/10 border border-blue-500/20 space-y-2">
            <div className="font-bold text-white text-sm">Need cleanroom Bay navigation?</div>
            <p className="text-xs text-text-secondary">
              Open the interactive floor plan to pinpoint tool locations, sensor health, and ambient bay cleanroom classes.
            </p>
            <button
              onClick={() => navigate('/floor')}
              className="mt-2 w-full py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 font-mono text-xs font-bold transition-all"
            >
              Open Cleanroom Floor Map →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
