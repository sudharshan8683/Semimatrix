import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'

function App() {
  const initAuth = useAuthStore(state => state.initAuth)

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <RouterProvider router={router} />
  )
}

export default App
