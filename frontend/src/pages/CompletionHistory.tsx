import { motion } from 'framer-motion'
import { CheckCircle2, User, Calendar, Settings } from 'lucide-react'

const historyData = [
  { id: 'TKT-891', tool: 'Lithography Tool 3', engineer: 'Alex M.', date: '2026-09-23 14:30', description: 'Replaced focus ring' },
  { id: 'TKT-890', tool: 'Etch Tool 5', engineer: 'Sarah K.', date: '2026-09-22 09:15', description: 'Cleaned chamber plasma shower' },
  { id: 'TKT-889', tool: 'Deposition Tool 2', engineer: 'David R.', date: '2026-09-21 16:45', description: 'Routine preventive maintenance' },
  { id: 'TKT-888', tool: 'Inspection Tool 9', engineer: 'Sarah K.', date: '2026-09-20 11:20', description: 'Calibrated optical sensors' },
  { id: 'TKT-887', tool: 'Ion_Implant Tool 1', engineer: 'Alex M.', date: '2026-09-19 13:00', description: 'Source filament replacement' },
]

export const CompletionHistory = () => {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary mb-2">Engineer Completion Log</h1>
        <p className="text-text-secondary text-sm">Historical record of all defects and maintenance tasks completed by engineers.</p>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-text-secondary text-xs uppercase tracking-widest bg-white/5">
              <th className="py-4 font-medium pl-6">Ticket ID</th>
              <th className="py-4 font-medium">Equipment</th>
              <th className="py-4 font-medium">Completed By</th>
              <th className="py-4 font-medium">Date & Time</th>
              <th className="py-4 font-medium pr-6 text-right">Action Performed</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {historyData.map((log, i) => (
              <motion.tr 
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="border-b border-white/5 hover:bg-white/5 transition-colors group"
              >
                <td className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-status-running" />
                    <span className="font-mono text-brand font-bold">{log.id}</span>
                  </div>
                </td>
                <td className="py-4 text-white font-medium">
                  <div className="flex items-center gap-2">
                    <Settings size={14} className="text-text-muted" />
                    {log.tool}
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-xs">
                      {log.engineer.charAt(0)}
                    </div>
                    <span className="text-white font-medium">{log.engineer}</span>
                  </div>
                </td>
                <td className="py-4 text-text-muted">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    {log.date}
                  </div>
                </td>
                <td className="py-4 pr-6 text-right text-text-secondary italic">
                  {log.description}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
