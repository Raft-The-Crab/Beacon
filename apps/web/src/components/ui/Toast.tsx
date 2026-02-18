import { useEffect, useState } from 'react'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import styles from './Toast.module.css'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
  duration?: number
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={20} />,
  error: <AlertCircle size={20} />,
  info: <Info size={20} />,
  warning: <AlertTriangle size={20} />,
}

interface ToastComponentProps extends ToastMessage {
  onRemove: (id: string) => void
}

function ToastComponent({ id, message, type, duration = 4000, onRemove }: ToastComponentProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onRemove(id), duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onRemove])

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.icon}>{toastIcons[type]}</div>
      <div className={styles.message}>{message}</div>
      <button
        className={styles.closeButton}
        onClick={() => onRemove(id)}
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          {...toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

// Store for managing toasts globally
let toastId = 0
let listeners: Set<(toasts: ToastMessage[]) => void> = new Set()
let toasts: ToastMessage[] = []

export const useToast = () => {
  const [toastList, setToastList] = useState<ToastMessage[]>([])

  useEffect(() => {
    listeners.add(setToastList)
    return () => { listeners.delete(setToastList) }
  }, [])

  const show = (message: string, type: ToastType = 'info', duration?: number) => {
    const id = String(toastId++)
    const newToast: ToastMessage = { id, message, type, duration }
    toasts = [...toasts, newToast]
    listeners.forEach(listener => listener(toasts))
  }

  const remove = (id: string) => {
    toasts = toasts.filter(t => t.id !== id)
    listeners.forEach(listener => listener(toasts))
  }

  return {
    toasts: toastList,
    show,
    remove,
    success: (msg: string, duration?: number) => show(msg, 'success', duration),
    error: (msg: string, duration?: number) => show(msg, 'error', duration),
    info: (msg: string, duration?: number) => show(msg, 'info', duration),
    warning: (msg: string, duration?: number) => show(msg, 'warning', duration),
  }
}
