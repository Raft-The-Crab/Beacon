import { Modal } from './Modal'
import { Button } from './Button'
import { AlertTriangle, Info, HelpCircle } from 'lucide-react'
import styles from './ConfirmModal.module.css'

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void | Promise<void>
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'primary' | 'info'
    loading?: boolean
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'primary',
    loading = false
}: ConfirmModalProps) {
    const Icon = variant === 'danger' ? AlertTriangle : variant === 'info' ? Info : HelpCircle

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm" hideHeader>
            <div className={styles.container}>
                <div className={`${styles.iconWrapper} ${styles[variant]}`}>
                    <Icon size={24} />
                </div>
                
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.message}>{message}</p>
                
                <div className={styles.actions}>
                    <Button 
                        variant="secondary" 
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button 
                        variant={variant === 'danger' ? 'danger' : 'primary'} 
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
