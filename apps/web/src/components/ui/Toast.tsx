import { useEffect } from 'react'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, Crown } from 'lucide-react'
import { useNotificationSystem, ToastType } from '../../stores/useNotificationSystem'
import styles from '../../styles/modules/ui/Toast.module.css'

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
  premium: <Crown size={20} className={styles.premiumIcon} />,
}

interface ToastComponentProps extends Toast {
  onRemove: (id: string) => void
}

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

function ToastComponent({ id, message, type, duration = 4000, onRemove }: ToastComponentProps) {
  useEffect(() => {
    if (duration > 0 && duration !== Infinity) {
      const timer = setTimeout(() => onRemove(id), duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onRemove])

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.icon}>{toastIcons[type]}</div>
      <div className={styles.message}>
        {typeof message === 'object' ? JSON.stringify(message) : String(message)}
      </div>
      <button
        className={styles.closeButton}
        onClick={() => onRemove(id)}
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
      <div className={styles.progress} style={{ animationDuration: `${duration}ms` }} />
    </div>
  )
}

export function ToastContainer() {
  const { toasts, remove } = useNotificationSystem()
  
  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          {...toast}
          onRemove={remove}
        />
      ))}
    </div>
  )
}

/**
 * Hook for components to trigger toast notifications.
 * Uses the global useNotificationSystem store for state.
 */
export const useToast = () => {
    const { show, remove, toasts } = useNotificationSystem();

    return {
        toasts,
        show,
        remove,
        success: (msg: string, dur?: number) => show(msg, 'success', dur),
        error: (msg: string, dur?: number) => show(msg, 'error', dur),
        info: (msg: string, dur?: number) => show(msg, 'info', dur),
        warning: (msg: string, dur?: number) => show(msg, 'warning', dur),
        premium: (msg: string, dur?: number) => show(msg, 'premium', dur),
    };
};
