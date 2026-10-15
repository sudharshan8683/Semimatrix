import { useLocation, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowLeft, Calendar, User, Wrench, ShieldCheck } from 'lucide-react'

export const CompletedTask = () => {
  const location = useLocation()
  const data = location.state

  if (!data) return <Navigate to="/maintenance" replace />

  const { task, completedBy, completedDate } = data
  const dateObj = new Date(completedDate)

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel p-10 rounded-3xl w-full max-w-2xl border border-status-running/30 shadow-[0_0_50px_rgba(52,211,153,0.15)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-status-running to-brand"></div>
        
        <div className="flex flex-col items-center text-center mb-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-24 h-24 bg-status-running/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(52,211,153,0.3)]"
          >
            <CheckCircle size={48} className="text-status-running" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Maintenance Completed!</h1>
          <p className="text-text-secondary text-lg">Ticket <span className="text-brand font-mono">{task.id}</span> has been successfully resolved.</p>
        </div>

        <div className="bg-background/50 rounded-2xl p-6 mb-8 border border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-brand/10 text-brand">
                <Wrench size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Equipment</p>
                <p className="text-white font-semibold text-lg">{task.tool}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Original Priority</p>
                <p className="text-white font-semibold text-lg">{task.priority}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                <User size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Completed By</p>
                <p className="text-white font-semibold text-lg">{completedBy}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Completion Date</p>
                <p className="text-white font-semibold text-lg">{dateObj.toLocaleDateString()} <span className="text-sm text-text-muted">{dateObj.toLocaleTimeString()}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Link 
            to="/maintenance"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Maintenance Hub
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
