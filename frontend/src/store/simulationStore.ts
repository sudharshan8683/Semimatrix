import { create } from 'zustand'

export interface KPIState {
  uptime: number
  yield: number
  at_risk: number
  upcoming_maintenance: number
  active_alerts: number
  utilization: number
  good_wafers?: number
  lost_wafers?: number
}

export interface EquipmentState {
  id: number
  machine_id: string
  name: string
  status: 'IDLE' | 'RUNNING' | 'DOWN' | 'MAINTENANCE' | 'WARNING' | 'CRITICAL' | 'OFFLINE'
  process_type: string
  health_score: number
  bay_zone: string
}

interface SimulationStore {
  kpis: KPIState | null
  equipments: EquipmentState[]
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}

let ws: WebSocket | null = null

export const useSimulationStore = create<SimulationStore>((set) => ({
  kpis: null,
  equipments: [],
  isConnected: false,
  connect: () => {
    if (ws) return
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/live'
    ws = new WebSocket(wsUrl)
    
    ws.onopen = () => set({ isConnected: true })
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'LIVE_UPDATE') {
          set({
            kpis: data.kpis,
            equipments: data.equipment
          })
        }
      } catch (err) {
        console.error('Failed to parse WS message', err)
      }
    }
    
    ws.onclose = () => {
      set({ isConnected: false })
      ws = null
      // Simple reconnect logic
      setTimeout(() => {
        useSimulationStore.getState().connect()
      }, 3000)
    }
    
    ws.onerror = () => {
      ws?.close()
    }
  },
  disconnect: () => {
    if (ws) {
      ws.close()
      ws = null
    }
  }
}))
