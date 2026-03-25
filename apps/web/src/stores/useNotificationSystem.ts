import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'premium';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface NotificationSystemState {
  toasts: Toast[];
  show: (message: string, type?: ToastType, duration?: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

// Simple hash function for deduplication
const hashMessage = (msg: string) => {
    let hash = 0;
    for (let i = 0; i < msg.length; i++) {
        const char = msg.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
};

export const useNotificationSystem = create<NotificationSystemState>((set, get) => ({
  toasts: [],

  show: (message, type = 'info', duration = 3000) => {
    const id = `${hashMessage(message)}-${Date.now()}`;
    
    // Deduplication logic: Don't show the exact same message within 2 seconds
    const existing = get().toasts.find(t => t.message === message);
    if (existing) {
        // Find if it was added very recently (e.g. within 2 seconds)
        // We use the ID suffix for timing if needed, but a simple check is often enough
        return; 
    }

    const newToast: Toast = { id, message, type, duration };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    if (duration !== Infinity) {
      setTimeout(() => {
        get().remove(id);
      }, duration);
    }
  },

  remove: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clear: () => set({ toasts: [] }),
}));
