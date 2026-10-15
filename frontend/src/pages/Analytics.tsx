import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { SecomPredictor } from '../components/analytics/SecomPredictor'

const yieldData = [
  { time: 'Mon', yield: 94.2 },
  { time: 'Tue', yield: 95.1 },
  { time: 'Wed', yield: 93.8 },
  { time: 'Thu', yield: 96.4 },
  { time: 'Fri', yield: 97.2 },
  { time: 'Sat', yield: 98.1 },
  { time: 'Sun', yield: 97.8 },
]

const defectData = [
  { type: 'Particle', count: 420 },
  { type: 'Scratch', count: 150 },
  { type: 'Pattern', count: 320 },
  { type: 'Edge', count: 180 },
]

export const Analytics = () => {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary mb-2">Yield Analytics</h1>
        <p className="text-text-secondary text-sm">Deep dive into historical yield and defect pareto.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          className="glass-panel p-6 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-bold text-white mb-6">7-Day Yield Trend</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yieldData}>
                <defs>
                  <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <YAxis domain={[90, 100]} stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#38BDF8' }}
                />
                <Area type="monotone" dataKey="yield" stroke="#38BDF8" strokeWidth={3} fillOpacity={1} fill="url(#colorYield)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          className="glass-panel p-6 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold text-white mb-6">Defect Pareto</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defectData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <YAxis dataKey="type" type="category" stroke="#94a3b8" tick={{fill: '#e2e8f0'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <SecomPredictor />
    </div>
  )
}
