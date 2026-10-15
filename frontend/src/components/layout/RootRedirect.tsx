import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export const RootRedirect = () => {
  const user = useAuthStore(state => state.user)
  const isInitialized = useAuthStore(state => state.isInitialized)
  
  if (!isInitialized) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background text-brand font-bold tracking-widest animate-pulse font-mono">
        INITIALIZING FABSENSE ROLE WORKSPACE...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // All roles land on their dedicated, tailor-made dashboard
  return <Navigate to="/dashboard" replace />
}
