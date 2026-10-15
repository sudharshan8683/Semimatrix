import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Wrench, AlertTriangle, Clock, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const tasks = [
  { id: 'TKT-892', tool: 'Ion_Implant Tool 6', status: 'IN_PROGRESS', priority: 'High', engineer: 'Alex M.', time: 'Started 2h ago' },
  { id: 'TKT-893', tool: 'Cleaning Tool 7', status: 'SCHEDULED', priority: 'Medium', engineer: 'Sarah K.', time: 'Starts in 4h' },
  { id: 'TKT-894', tool: 'Inspection Tool 9', status: 'PENDING', priority: 'High', engineer: 'Unassigned', time: 'Overdue' },
  { id: 'TKT-895', tool: 'Deposition Tool 2', status: 'COMPLETED', priority: 'Low', engineer: 'David R.', time: 'Finished 1d ago' },
]

export const Maintenance = () => {
  const [selectedTask, setSelectedTask] = useState<typeof tasks[0] | null>(null)
  const navigate = useNavigate()

  const handleComplete = () => {
    navigate('/maintenance/completed', { 
      state: { 
        task: selectedTask, 
        completedBy: selectedTask?.engineer || 'System User',
        completedDate: new Date().toISOString() 
      } 
    })
  }

  return (
    <div className="space-y-8 pb-12 relative">
      <div>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary mb-2">Maintenance Hub</h1>
        <p className="text-text-secondary text-sm">Manage work orders, schedule repairs, and track equipment health.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task, i) => (
          <motion.div 
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-5 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-6">
              <div className={`p-3 rounded-full ${
                task.status === 'COMPLETED' ? 'bg-status-running/20 text-status-running' : 
                task.status === 'IN_PROGRESS' ? 'bg-brand/20 text-brand' : 
                task.status === 'PENDING' ? 'bg-status-critical/20 text-status-critical' : 
                'bg-amber-400/20 text-amber-400'
              }`}>
                {task.status === 'COMPLETED' ? <CheckCircle2 size={24} /> : 
                 task.status === 'IN_PROGRESS' ? <Wrench size={24} /> : 
                 task.status === 'PENDING' ? <AlertTriangle size={24} /> : 
                 <Clock size={24} />}
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-brand text-sm">{task.id}</span>
                  <span className="font-bold text-white text-lg">{task.tool}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-text-muted font-medium">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-text-secondary"></span>
                    {task.engineer}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-text-secondary"></span>
                    {task.time}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                task.priority === 'High' ? 'bg-status-critical/10 border-status-critical/30 text-status-critical' : 
                task.priority === 'Medium' ? 'bg-amber-400/10 border-amber-400/30 text-amber-400' : 
                'bg-status-running/10 border-status-running/30 text-status-running'
              }`}>
                {task.priority} Priority
              </span>
              <button 
                onClick={() => setSelectedTask(task)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors"
              >
                View Details
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel p-6 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedTask(null)}
                className="absolute right-4 top-4 text-text-muted hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-2">{selectedTask.id} Details</h2>
              <div className="text-text-secondary mb-6 border-b border-white/10 pb-4">
                Equipment: <span className="text-brand font-semibold">{selectedTask.tool}</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted text-sm font-medium">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    selectedTask.status === 'COMPLETED' ? 'bg-status-running/10 border-status-running/30 text-status-running' : 
                    selectedTask.status === 'IN_PROGRESS' ? 'bg-brand/10 border-brand/30 text-brand' : 
                    selectedTask.status === 'PENDING' ? 'bg-status-critical/10 border-status-critical/30 text-status-critical' : 
                    'bg-amber-400/10 border-amber-400/30 text-amber-400'
                  }`}>
                    {selectedTask.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted text-sm font-medium">Assigned Engineer</span>
                  <span className="text-white font-semibold">{selectedTask.engineer}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted text-sm font-medium">Timeline</span>
                  <span className="text-white font-semibold">{selectedTask.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted text-sm font-medium">Priority Level</span>
                  <span className="text-white font-semibold">{selectedTask.priority}</span>
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t border-white/10 flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors"
                >
                  Close
                </button>
                {selectedTask.status !== 'COMPLETED' && (
                  <button 
                    onClick={handleComplete}
                    className="px-4 py-2 rounded-lg bg-brand text-background text-sm font-bold hover:bg-brand/90 transition-colors"
                  >
                    Mark as Complete
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
