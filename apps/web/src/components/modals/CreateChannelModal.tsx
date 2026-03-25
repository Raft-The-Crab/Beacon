import { useEffect, useState, type ReactNode } from 'react'
import { Hash, Megaphone, MessageSquare, Radio, Volume2 } from 'lucide-react'
import { Modal, Button, Input } from '../ui'
import { useUIStore } from '../../stores/useUIStore'
import { useServerStore } from '../../stores/useServerStore'
import styles from '../../styles/modules/modals/CreateChannelModal.module.css'

interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateChannelModal({ isOpen, onClose }: CreateChannelModalProps) {
  const [channelName, setChannelName] = useState('')
  const [type, setType] = useState<'text' | 'voice' | 'stage' | 'forum' | 'announcement' | 'category'>('text')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { currentServer, createChannel } = useServerStore()
  const { setShowCreateChannel, createChannelType, createChannelParentId } = useUIStore()

  useEffect(() => {
    if (!isOpen) return
    if (createChannelType) {
      setType(createChannelType)
    }
  }, [isOpen, createChannelType])

  const channelTypeOptions: Array<{
    key: 'text' | 'voice' | 'stage' | 'forum' | 'announcement' | 'category'
    label: string
    description: string
    icon: ReactNode
  }> = [
    {
      key: 'text',
      label: 'Text',
      description: 'Send messages, images, GIFs, emoji, and opinions',
      icon: <Hash size={24} className={styles.typeIcon} />,
    },
    {
      key: 'voice',
      label: 'Voice',
      description: 'Hang out together with voice, video, and screen share',
      icon: <Volume2 size={24} className={styles.typeIcon} />,
    },
    {
      key: 'stage',
      label: 'Stage',
      description: 'Host one-to-many conversations with speakers and audience',
      icon: <Radio size={24} className={styles.typeIcon} />,
    },
    {
      key: 'forum',
      label: 'Forum',
      description: 'Organize discussions into topics and threads',
      icon: <MessageSquare size={24} className={styles.typeIcon} />,
    },
    {
      key: 'announcement',
      label: 'Announcement',
      description: 'Broadcast important updates to members',
      icon: <Megaphone size={24} className={styles.typeIcon} />,
    },
    {
      key: 'category',
      label: 'Category',
      description: 'Group your channels into organized sections',
      icon: <Hash size={24} className={styles.typeIcon} style={{ transform: 'rotate(90deg)' }} />,
    },
  ]

  const handleCreate = () => {
    if (!channelName.trim() || !currentServer || isLoading) return

    setIsLoading(true)
    setError(null)
    const normalizedName = type === 'category' ? channelName : channelName.trim()
    createChannel(currentServer.id, normalizedName, type.toUpperCase(), createChannelParentId ?? undefined).then(() => {
      setShowCreateChannel(false)
      onClose()
      setIsLoading(false)
      setError(null)
    }).catch(err => {
      console.error(err)
      setError(err?.message || 'Failed to create channel. Please try again.')
      setIsLoading(false)
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === 'category' ? 'Create Category' : 'Create Channel'}>
      <div className={styles.container}>
        <div className={styles.typeSelector}>
          <p className={styles.label}>{type === 'category' ? 'CATEGORY TYPE' : 'CHANNEL TYPE'}</p>
          {channelTypeOptions.map((option) => (
            <button
              key={option.key}
              className={`${styles.typeOption} ${type === option.key ? styles.active : ''}`}
              onClick={() => setType(option.key)}
            >
              {option.icon}
              <div className={styles.typeInfo}>
                <span className={styles.typeName}>{option.label}</span>
                <span className={styles.typeDesc}>{option.description}</span>
              </div>
              <div className={styles.radio}>
                {type === option.key && <div className={styles.radioInner} />}
              </div>
            </button>
          ))}
        </div>

        <Input
          label={type === 'category' ? 'CATEGORY NAME' : 'CHANNEL NAME'}
          placeholder={type === 'category' ? 'New Category' : 'new-channel'}
          value={channelName}
          onChange={(e) => setChannelName(e.currentTarget.value)}
          icon={type === 'category' ? <Hash size={18} /> : type === 'voice' || type === 'stage' ? <Volume2 size={18} /> : type === 'announcement' ? <Megaphone size={18} /> : <Hash size={18} />}
          required
        />

        <div className={styles.privateToggle}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>Private Channel</span>
            <span className={styles.toggleDesc}>Only selected members and roles will be able to view this channel.</span>
          </div>
          {/* Using a simple checkbox as a toggle for now */}
          <input type="checkbox" className={styles.checkbox} />
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(242, 63, 67, 0.1)', border: '1px solid rgba(242, 63, 67, 0.3)', borderRadius: '8px', color: 'var(--status-error)', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!channelName.trim() || isLoading}>
            {isLoading ? 'Creating...' : type === 'category' ? 'Create Category' : 'Create Channel'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
