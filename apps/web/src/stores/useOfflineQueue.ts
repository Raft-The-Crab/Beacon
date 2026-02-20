import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { wsClient } from '../services/websocket'

interface QueuedMessage {
  id: string
  channelId: string
  content: string
  timestamp: number
  retries: number
  status: 'pending' | 'sending' | 'failed'
}

interface OfflineQueueStore {
  queue: QueuedMessage[]
  isOnline: boolean
  
  addToQueue: (channelId: string, content: string) => string
  removeFromQueue: (id: string) => void
  retryMessage: (id: string) => void
  processQueue: () => void
  setOnline: (online: boolean) => void
  clearQueue: () => void
}

export const useOfflineQueue = create<OfflineQueueStore>()(
  persist(
    (set, get) => ({
      queue: [],
      isOnline: navigator.onLine,

      addToQueue: (channelId: string, content: string) => {
        const id = `offline_${Date.now()}_${Math.random()}`
        const message: QueuedMessage = {
          id,
          channelId,
          content,
          timestamp: Date.now(),
          retries: 0,
          status: 'pending'
        }

        set(state => ({
          queue: [...state.queue, message]
        }))

        // Try to send immediately if online
        if (get().isOnline && wsClient.isConnected()) {
          setTimeout(() => get().retryMessage(id), 100)
        }

        return id
      },

      removeFromQueue: (id: string) => {
        set(state => ({
          queue: state.queue.filter(msg => msg.id !== id)
        }))
      },

      retryMessage: async (id: string) => {
        const state = get()
        const message = state.queue.find(msg => msg.id === id)
        
        if (!message || message.status === 'sending') return

        // Max 3 retries
        if (message.retries >= 3) {
          set(state => ({
            queue: state.queue.map(msg =>
              msg.id === id ? { ...msg, status: 'failed' as const } : msg
            )
          }))
          return
        }

        // Update status to sending
        set(state => ({
          queue: state.queue.map(msg =>
            msg.id === id ? { ...msg, status: 'sending' as const, retries: msg.retries + 1 } : msg
          )
        }))

        try {
          wsClient.sendMessage(message.channelId, message.content)
          
          // Wait for confirmation (simplified - in production, track message IDs)
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Remove from queue on success
          get().removeFromQueue(id)
        } catch (error) {
          console.error('Failed to send queued message:', error)
          
          // Reset to pending for retry
          set(state => ({
            queue: state.queue.map(msg =>
              msg.id === id ? { ...msg, status: 'pending' as const } : msg
            )
          }))
        }
      },

      processQueue: () => {
        const state = get()
        if (!state.isOnline || !wsClient.isConnected()) return

        const pendingMessages = state.queue.filter(msg => msg.status === 'pending')
        
        pendingMessages.forEach(msg => {
          setTimeout(() => get().retryMessage(msg.id), 100)
        })
      },

      setOnline: (online: boolean) => {
        set({ isOnline: online })
        
        if (online) {
          // Process queue when coming back online
          setTimeout(() => get().processQueue(), 1000)
        }
      },

      clearQueue: () => {
        set({ queue: [] })
      }
    }),
    {
      name: 'beacon-offline-queue',
      partialize: (state) => ({ queue: state.queue })
    }
  )
)

// Setup online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineQueue.getState().setOnline(true)
  })

  window.addEventListener('offline', () => {
    useOfflineQueue.getState().setOnline(false)
  })
}
