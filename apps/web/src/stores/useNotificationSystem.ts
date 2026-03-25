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
    let sanitizedMessage = '';
    if (typeof message === 'string') {
        sanitizedMessage = message;
    } else if (message && typeof message === 'object') {
        sanitizedMessage = (message as any).message || (message as any).error || JSON.stringify(message);
    } else {
        sanitizedMessage = String(message);
    }

    const id = `${hashMessage(sanitizedMessage)}-${Date.now()}`;
    
    // Deduplication logic: Don't show the exact same message within 2 seconds
    const existing = get().toasts.find(t => t.message === sanitizedMessage);
    if (existing) {
        return; 
    }

    const newToast: Toast = { id, message: sanitizedMessage, type, duration };
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
