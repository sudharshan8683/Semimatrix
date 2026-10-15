import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore, EquipmentState } from '../store/simulationStore'
import { Skeleton } from '../components/Skeleton'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'RUNNING': return 'border-status-running/40 text-status-running shadow-[inset_0_0_20px_rgba(52,211,153,0.1)]'
    case 'IDLE': return 'border-status-idle/40 text-status-idle'
    case 'DOWN':
    case 'CRITICAL': return 'border-status-critical/40 text-status-critical shadow-[inset_0_0_20px_rgba(248,113,113,0.1)]'
    case 'WARNING': return 'border-status-warning/40 text-status-warning'
    case 'MAINTENANCE': return 'border-brand/40 text-brand'
    default: return 'border-border/40 text-text-muted'
  }
}

const getStatusDot = (status: string) => {
  switch (status) {
    case 'RUNNING': return 'bg-status-running shadow-[0_0_10px_rgba(52,211,153,0.8)]'
    case 'IDLE': return 'bg-status-idle'
    case 'DOWN':
    case 'CRITICAL': return 'bg-status-critical shadow-[0_0_10px_rgba(248,113,113,0.8)]'
    case 'WARNING': return 'bg-status-warning shadow-[0_0_10px_rgba(251,191,36,0.8)]'
    case 'MAINTENANCE': return 'bg-brand shadow-[0_0_10px_rgba(56,189,248,0.8)]'
    default: return 'bg-text-muted'
  }
}

export const FabFloor = () => {
  const { equipments, connect } = useSimulationStore()
  const [selectedTool, setSelectedTool] = useState<EquipmentState | null>(null)

  useEffect(() => {
    connect()
  }, [connect])

  // Group by process_type to simulate bays
  const bays = equipments.reduce((acc, eq) => {
    if (!acc[eq.process_type]) acc[eq.process_type] = []
    acc[eq.process_type].push(eq)
    return acc
  }, {} as Record<string, EquipmentState[]>)

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary mb-2">FAB Floor Map</h1>
        <p className="text-text-secondary text-sm">Interactive overview of all bays and equipment statuses.</p>
      </div>
      
      {!equipments.length ? (
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-4 pb-12">
          {Object.entries(bays).map(([bayName, eqs]) => (
            <div key={bayName} className="mb-10">
              <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-3">
                <span className="w-8 h-[1px] bg-brand/50 block"></span>
                {bayName.replace('_', ' ')} BAY
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {eqs.map(eq => (
                  <motion.div
                    key={eq.id}
                    layout
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTool(eq)}
                    className={`cursor-pointer glass-panel rounded-2xl p-5 flex flex-col justify-between h-36 transition-all duration-300 ${getStatusColor(eq.status)} group`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-base font-bold tracking-tight text-white group-hover:text-brand transition-colors drop-shadow-sm">{eq.machine_id}</span>
                      <div className="relative flex h-3 w-3 mt-1">
                        {eq.status === 'RUNNING' && (
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusDot(eq.status)}`} />
                        )}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${getStatusDot(eq.status)}`} />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary font-medium mb-2 truncate">{eq.name}</div>
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold tracking-wider">{eq.status}</span>
                        <div className="bg-background/60 px-2.5 py-1 rounded-md text-xs font-mono font-medium backdrop-blur-md border border-white/10 text-white">
                          {eq.health_score}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedTool && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10"
              onClick={() => setSelectedTool(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-full max-w-md glass-panel border-l border-white/10 shadow-[auto_auto_30px_rgba(0,0,0,0.5)] z-20 p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{selectedTool.name}</h2>
                  <div className="text-xs font-mono text-brand tracking-widest">{selectedTool.machine_id}</div>
                </div>
                <button 
                  onClick={() => setSelectedTool(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-secondary hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className={`p-5 rounded-2xl border mb-8 bg-black/20 ${getStatusColor(selectedTool.status)}`}>
                <div className="text-xs opacity-80 uppercase tracking-widest mb-2 font-medium">Current Status</div>
                <div className="text-3xl font-bold tracking-tight flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusDot(selectedTool.status)}`} />
                  {selectedTool.status}
                </div>
              </div>
              
              <div className="space-y-8 flex-1">
                <div>
                  <h3 className="text-xs font-bold text-text-secondary tracking-widest mb-4">KEY METRICS</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="text-xs text-text-secondary font-medium mb-2">Health Score</div>
                      <div className="text-2xl font-mono text-white font-light">{selectedTool.health_score}%</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="text-xs text-text-secondary font-medium mb-2">Bay Zone</div>
                      <div className="text-lg font-bold text-white">{selectedTool.bay_zone}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors col-span-2">
                      <div className="text-xs text-text-secondary font-medium mb-2">Process Type</div>
                      <div className="text-lg font-mono text-brand tracking-wide">{selectedTool.process_type}</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-5 bg-gradient-to-br from-brand/10 to-brand-accent/5 border border-brand/20 rounded-xl text-brand text-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  <div className="relative z-10 font-medium">Live sensor trend visualizations would be rendered here for {selectedTool.machine_id}, mapping to backend telemetry history.</div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
