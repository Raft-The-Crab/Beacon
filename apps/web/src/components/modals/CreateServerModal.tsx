import { useState } from 'react'
import { Plus, ChevronRight, Gamepad2, School, GraduationCap } from 'lucide-react'
import { Modal, Button, Input, AvatarUpload } from '../ui'
import { useUIStore } from '../../stores/useUIStore'
import { useServerStore } from '../../stores/useServerStore'
import styles from './CreateServerModal.module.css'

interface CreateServerModalProps {
  isOpen: boolean
  onClose: () => void
}

type Step = 'choose' | 'customize'

export function CreateServerModal({ isOpen, onClose }: CreateServerModalProps) {
  const [step, setStep] = useState<Step>('choose')
  const [serverName, setServerName] = useState('')
  const [serverIcon, setServerIcon] = useState<string | undefined>()
  const { createGuild } = useServerStore()
  const { setShowCreateServer } = useUIStore()

  const handleCreate = () => {
    if (!serverName.trim()) return
    createGuild(serverName, serverIcon).then(() => {
      setShowCreateServer(false)
      onClose()
    }).catch(console.error)
  }

  const renderChoose = () => (
    <div className={styles.container}>
      <h1 className={styles.title}>Create Your Server</h1>
      <p className={styles.subtitle}>Your server is where you and your friends hang out. Make yours and start talking.</p>

      <div className={styles.optionList}>
        <button className={styles.option} onClick={() => { setStep('customize'); setServerName('My Server') }}>
          <div className={styles.optionIcon}><Plus size={24} /></div>
          <div className={styles.optionContent}>
            <span className={styles.optionName}>Create My Own</span>
          </div>
          <ChevronRight size={20} className={styles.chevron} />
        </button>

        <p style={{ marginTop: '16px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Start from a template</p>

        <button className={styles.option} onClick={() => { setStep('customize'); setServerName('Gaming Hub') }}>
          <div className={styles.optionIcon}><Gamepad2 size={24} /></div>
          <div className={styles.optionContent}>
            <span className={styles.optionName}>Gaming</span>
          </div>
          <ChevronRight size={20} />
        </button>

        <button className={styles.option} onClick={() => { setStep('customize'); setServerName('School Club') }}>
          <div className={styles.optionIcon}><GraduationCap size={24} /></div>
          <div className={styles.optionContent}>
            <span className={styles.optionName}>School Club</span>
          </div>
          <ChevronRight size={20} />
        </button>

        <button className={styles.option} onClick={() => { setStep('customize'); setServerName('Study Group') }}>
          <div className={styles.optionIcon}><School size={24} /></div>
          <div className={styles.optionContent}>
            <span className={styles.optionName}>Study Group</span>
          </div>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )

  const renderCustomize = () => (
    <div className={styles.container}>
      <h1 className={styles.title}>Customize Your Server</h1>
      <p className={styles.subtitle}>Give your new server a personality with a name and an icon. You can always change it later.</p>

      <div className={styles.form}>
        <div className={styles.avatarUploadWrapper}>
          <AvatarUpload
            currentAvatar={serverIcon}
            onUpload={(file) => setServerIcon(file.url)}
            size={80}
            type="server"
          />
        </div>

        <Input 
          label="SERVER NAME"
          value={serverName}
          onChange={(e) => setServerName(e.target.value)}
          placeholder="Enter server name"
        />
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" onClick={() => setStep('choose')}>Back</Button>
        <Button variant="primary" onClick={handleCreate} disabled={!serverName.trim()}>Create</Button>
      </div>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      {step === 'choose' ? renderChoose() : renderCustomize()}
    </Modal>
  )
}
