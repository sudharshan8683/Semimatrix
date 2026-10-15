import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useSimulationStore } from '../store/simulationStore'
import { AdminDashboard } from '../components/dashboard/AdminDashboard'
import { ProductionManagerDashboard } from '../components/dashboard/ProductionManagerDashboard'
import { MaintenanceEngineerDashboard } from '../components/dashboard/MaintenanceEngineerDashboard'
import { QualityEngineerDashboard } from '../components/dashboard/QualityEngineerDashboard'
import { ViewerDashboard } from '../components/dashboard/ViewerDashboard'
import { Shield, Factory, Wrench, Cpu, Eye, LayoutGrid } from 'lucide-react'

export const Dashboard: React.FC = () => {
  const user = useAuthStore(state => state.user)
  const connect = useSimulationStore(state => state.connect)

  useEffect(() => {
    connect()
  }, [connect])

  // Normalize role from current user
  const normalizeRole = (role?: string) => {
    if (!role) return 'ADMIN'
    const r = role.toUpperCase().replace('-', '_')
    if (r.includes('ADMIN')) return 'ADMIN'
    if (r.includes('PROD')) return 'PRODUCTION_MANAGER'
    if (r.includes('MAINT')) return 'MAINTENANCE_ENGINEER'
    if (r.includes('QUAL')) return 'QUALITY_ENGINEER'
    if (r.includes('VIEW')) return 'VIEWER'
    return 'ADMIN'
  }

  const initialRole = normalizeRole(user?.role)
  
  // Local role view override for easy demo switching and role preview
  const [activeRoleView, setActiveRoleView] = useState<string>(initialRole)

  // Sync if user changes
  useEffect(() => {
    if (user?.role) {
      setActiveRoleView(normalizeRole(user.role))
    }
  }, [user])

  const renderDashboardByRole = () => {
    switch (activeRoleView) {
      case 'ADMIN':
        return <AdminDashboard />
      case 'PRODUCTION_MANAGER':
        return <ProductionManagerDashboard />
      case 'MAINTENANCE_ENGINEER':
        return <MaintenanceEngineerDashboard />
      case 'QUALITY_ENGINEER':
        return <QualityEngineerDashboard />
      case 'VIEWER':
        return <ViewerDashboard />
      default:
        return <AdminDashboard />
    }
  }

  return (
    <div className="relative">
      {/* Role Perspective Switcher (Allows testing every role's bespoke web workspace) */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6 p-3 rounded-2xl glass-panel border border-white/5">
        <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
          <LayoutGrid size={14} className="text-brand" />
          <span>Active Role Workspace:</span>
          <span className="text-white font-bold px-2 py-0.5 rounded bg-white/10">
            {activeRoleView.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
          <span className="text-text-muted text-[11px] mr-1 hidden sm:inline">Preview As:</span>
          
          <button
            onClick={() => setActiveRoleView('ADMIN')}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
              activeRoleView === 'ADMIN'
                ? 'bg-brand/20 border-brand/50 text-brand font-bold shadow-sm shadow-brand/20'
                : 'border-white/5 text-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield size={12} /> Admin
          </button>

          <button
            onClick={() => setActiveRoleView('PRODUCTION_MANAGER')}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
              activeRoleView === 'PRODUCTION_MANAGER'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold shadow-sm shadow-amber-500/20'
                : 'border-white/5 text-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Factory size={12} /> Prod Mgr
          </button>

          <button
            onClick={() => setActiveRoleView('MAINTENANCE_ENGINEER')}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
              activeRoleView === 'MAINTENANCE_ENGINEER'
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 font-bold shadow-sm shadow-blue-500/20'
                : 'border-white/5 text-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Wrench size={12} /> Maint Eng
          </button>

          <button
            onClick={() => setActiveRoleView('QUALITY_ENGINEER')}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
              activeRoleView === 'QUALITY_ENGINEER'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold shadow-sm shadow-emerald-500/20'
                : 'border-white/5 text-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu size={12} /> Qual Eng
          </button>

          <button
            onClick={() => setActiveRoleView('VIEWER')}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
              activeRoleView === 'VIEWER'
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 font-bold shadow-sm shadow-purple-500/20'
                : 'border-white/5 text-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Eye size={12} /> Viewer
          </button>
        </div>
      </div>

      {/* Render the role-specific dashboard */}
      {renderDashboardByRole()}
    </div>
  )
}
