import { useState } from 'react'
import { Plus, ChevronRight, Gamepad2, School, GraduationCap, ArrowLeft, Users, Globe } from 'lucide-react'
import { Modal, Button, Input, AvatarUpload } from '../ui'
import { useUIStore } from '../../stores/useUIStore'
import { useServerStore } from '../../stores/useServerStore'
import styles from '../../styles/modules/modals/CreateServerModal.module.css'

interface CreateServerModalProps {
  isOpen: boolean
  onClose: () => void
}

type Step = 'choose' | 'customize'

const TEMPLATES = [
  { id: 'gaming', label: 'Gaming', icon: <Gamepad2 size={24} />, description: 'For your gaming community' },
  { id: 'school', label: 'School Club', icon: <School size={24} />, description: 'For study groups and clubs' },
  { id: 'study', label: 'Study Group', icon: <GraduationCap size={24} />, description: 'Collaborate on homework' },
  { id: 'friends', label: 'Friends', icon: <Users size={24} />, description: 'Hang out with friends' },
  { id: 'community', label: 'Community', icon: <Globe size={24} />, description: 'Build a community' },
]

export function CreateServerModal({ isOpen, onClose }: CreateServerModalProps) {
  const [step, setStep] = useState<Step>('choose')
  const [serverName, setServerName] = useState('')
  const [serverIcon, setServerIcon] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [_selectedTemplate, setSelectedTemplate] = useState<string>('')
  const { createGuild } = useServerStore()
  const { setShowCreateServer } = useUIStore()

  const handleCreate = () => {
    if (!serverName.trim() || isLoading) return
    setIsLoading(true)
    setError(null)
    createGuild(serverName, serverIcon).then(() => {
      setShowCreateServer(false)
      onClose()
      setIsLoading(false)
      setStep('choose')
      setServerName('')
      setError(null)
    }).catch(err => {
      console.error(err)
      setError(err?.message || 'Failed to create server. Please try again.')
      setIsLoading(false)
    })
  }

  const handleClose = () => {
    setStep('choose')
    setServerName('')
    setSelectedTemplate('')
    onClose()
  }

  const renderChoose = () => (
    <div className={styles.stepChoose}>
      <h2 className={styles.title}>Create a Server</h2>
      <p className={styles.subtitle}>Your server is where you and your friends hang out. Make yours and start talking.</p>
      <div className={styles.templateList}>
        {TEMPLATES.map(template => (
          <button
            key={template.id}
            className={styles.templateBtn}
            onClick={() => {
              setSelectedTemplate(template.id)
              setServerName(`My ${template.label} Server`)
              setStep('customize')
            }}
          >
            <div className={styles.templateIcon}>{template.icon}</div>
            <div className={styles.templateInfo}>
              <span className={styles.templateLabel}>{template.label}</span>
              <span className={styles.templateDesc}>{template.description}</span>
            </div>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
      <div className={styles.divider}>
        <span>or</span>
      </div>
      <button
        className={styles.customBtn}
        onClick={() => setStep('customize')}
      >
        <Plus size={18} />
        <span>Create My Own</span>
      </button>
    </div>
  )

  const renderCustomize = () => (
    <div className={styles.stepCustomize}>
      <button className={styles.backBtn} onClick={() => setStep('choose')}>
        <ArrowLeft size={16} />
        Back
      </button>
      <h2 className={styles.title}>Customize your server</h2>
      <p className={styles.subtitle}>Give your new server a personality with a name and an icon. You can always change it later.</p>

      <div className={styles.iconSection}>
        <AvatarUpload
          currentAvatar={serverIcon}
          onUpload={(file: any) => setServerIcon(file?.url)}
          size={80}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>SERVER NAME</label>
        <Input
          value={serverName}
          onChange={(e: any) => setServerName(e.target.value)}
          placeholder="Enter server name"
        />
      </div>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(242, 63, 67, 0.1)', border: '1px solid rgba(242, 63, 67, 0.3)', borderRadius: '8px', color: 'var(--status-error)', fontSize: '14px', marginTop: '12px' }}>
          {error}
        </div>
      )}

      <div className={styles.footer}>
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button
          variant="primary"
          onClick={handleCreate}
          disabled={!serverName.trim() || isLoading}
        >
          {isLoading ? 'Creating...' : 'Create'}
        </Button>
      </div>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      {step === 'choose' ? renderChoose() : renderCustomize()}
    </Modal>
  )
}
