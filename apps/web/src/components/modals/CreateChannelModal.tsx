import { useState } from 'react'
import { Hash, Volume2 } from 'lucide-react'
import { Modal, Button, Input } from '../ui'
import { useUIStore } from '../../stores/useUIStore'
import { useServerStore } from '../../stores/useServerStore'
import styles from './CreateChannelModal.module.css'

interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateChannelModal({ isOpen, onClose }: CreateChannelModalProps) {
  const [channelName, setChannelName] = useState('')
  const [type, setType] = useState<'text' | 'voice'>('text')
  const { currentServer, createChannel } = useServerStore()
  const { setShowCreateChannel } = useUIStore()

  const handleCreate = () => {
    if (!channelName.trim() || !currentServer) return

    const normalizedName = channelName.toLowerCase().replace(/\s+/g, '-')
    createChannel(currentServer.id, normalizedName, type).then(() => {
      setShowCreateChannel(false)
      onClose()
    }).catch(console.error)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Channel">
      <div className={styles.container}>
        <div className={styles.typeSelector}>
          <p className={styles.label}>CHANNEL TYPE</p>
          
          <button 
            className={`${styles.typeOption} ${type === 'text' ? styles.active : ''}`}
            onClick={() => setType('text')}
          >
            <Hash size={24} className={styles.typeIcon} />
            <div className={styles.typeInfo}>
              <span className={styles.typeName}>Text</span>
              <span className={styles.typeDesc}>Send messages, images, GIFs, emoji, and opinions</span>
            </div>
            <div className={styles.radio}>
              {type === 'text' && <div className={styles.radioInner} />}
            </div>
          </button>

          <button 
            className={`${styles.typeOption} ${type === 'voice' ? styles.active : ''}`}
            onClick={() => setType('voice')}
          >
            <Volume2 size={24} className={styles.typeIcon} />
            <div className={styles.typeInfo}>
              <span className={styles.typeName}>Voice</span>
              <span className={styles.typeDesc}>Hang out together with voice, video, and screen share</span>
            </div>
            <div className={styles.radio}>
              {type === 'voice' && <div className={styles.radioInner} />}
            </div>
          </button>
        </div>

        <Input
          label="CHANNEL NAME"
          placeholder="new-channel"
          value={channelName}
          onChange={(e) => setChannelName(e.currentTarget.value)}
          icon={type === 'text' ? <Hash size={18} /> : <Volume2 size={18} />}
          required
        />
        
        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!channelName.trim()}>
            Create Channel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
