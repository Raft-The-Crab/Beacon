import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button, Input } from '../ui'
import { useAuthStore, PresenceStatus } from '../../stores/useAuthStore'
import { usePresenceStore } from '../../stores/usePresenceStore'
import styles from './StatusPicker.module.css'

interface StatusPickerProps {
  onClose?: () => void
}

const statusOptions: { value: PresenceStatus; label: string; description: string; color: string }[] = [
  {
    value: 'online',
    label: 'Online',
    description: 'You appear online and active',
    color: '#43b581',
  },
  {
    value: 'idle',
    label: 'Idle',
    description: 'You appear away or inactive',
    color: '#faa61a',
  },
  {
    value: 'dnd',
    label: 'Do Not Disturb',
    description: 'You will not receive notifications',
    color: '#f04747',
  },
  {
    value: 'invisible',
    label: 'Invisible',
    description: 'You appear offline to others',
    color: '#747f8d',
  },
]

export function StatusPicker({ onClose }: StatusPickerProps) {
  const { user } = useAuthStore()
  const { setPresence } = usePresenceStore()
  const [customStatus, setCustomStatus] = useState(user?.customStatus || '')
  const [selectedStatus, setSelectedStatus] = useState<PresenceStatus>(user?.status || 'online')

  const handleStatusChange = (status: PresenceStatus) => {
    setSelectedStatus(status)
    if (user) {
      setPresence(user.id, status, customStatus)
      // In real app, would call API to update status
    }
  }

  const handleCustomStatusSave = () => {
    if (user) {
      setPresence(user.id, selectedStatus, customStatus)
      // In real app, would call API to update custom status
    }
    onClose?.()
  }

  const handleClearCustomStatus = () => {
    setCustomStatus('')
    if (user) {
      setPresence(user.id, selectedStatus, '')
      // In real app, would call API to clear custom status
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Set Status</h3>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose}>
            <X size={18} />
          </button>
        )}
      </div>

      <div className={styles.customStatusSection}>
        <label className={styles.label}>Custom Status</label>
        <div className={styles.inputGroup}>
          <Input
            placeholder="What's on your mind?"
            value={customStatus}
            onChange={(e) => setCustomStatus(e.currentTarget.value)}
            maxLength={128}
          />
          {customStatus && (
            <button className={styles.clearButton} onClick={handleClearCustomStatus}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.statusOptions}>
        <label className={styles.label}>Status</label>
        {statusOptions.map((option) => (
          <button
            key={option.value}
            className={`${styles.statusOption} ${
              selectedStatus === option.value ? styles.active : ''
            }`}
            onClick={() => handleStatusChange(option.value)}
          >
            <div className={styles.statusInfo}>
              <div className={styles.statusIndicator} style={{ backgroundColor: option.color }} />
              <div className={styles.statusText}>
                <span className={styles.statusLabel}>{option.label}</span>
                <span className={styles.statusDescription}>{option.description}</span>
              </div>
            </div>
            {selectedStatus === option.value && (
              <Check size={20} className={styles.checkIcon} />
            )}
          </button>
        ))}
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleCustomStatusSave}>
          Save Status
        </Button>
      </div>
    </div>
  )
}
