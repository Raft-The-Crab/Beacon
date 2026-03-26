import { X, AlertCircle, CheckCircle, Info, AlertTriangle, Crown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)', transition: { duration: 0.2 } }}
      className={`${styles.toast} ${styles[type]}`}
      onHoverStart={(e) => {
        // Pause duration logic could go here if needed
      }}
    >
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
      {duration !== Infinity && (
        <motion.div 
          className={styles.progress} 
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          onAnimationComplete={() => onRemove(id)}
        />
      )}
    </motion.div>
  )
}

export function ToastContainer() {
  const { toasts, remove } = useNotificationSystem()
  
  return (
    <div className={styles.container}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            {...toast}
            onRemove={remove}
          />
        ))}
      </AnimatePresence>
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
