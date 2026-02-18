import { useState, useRef } from 'react'
import { X, Upload, Trash2 } from 'lucide-react'
import { useUIStore } from '../stores/useUIStore'
import { useServerStore } from '../stores/useServerStore'
import { AuditLogModal } from '../components/modals/AuditLogModal'
import WebhooksManager from '../components/modals/WebhooksManager'
import styles from './ServerSettings.module.css'

export function ServerSettings() {
  const { showServerSettings, setShowServerSettings } = useUIStore()
  const { currentServer, updateGuild, deleteGuild } = useServerStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [name, setName] = useState(currentServer?.name || '')
  const [hasChanges, setHasChanges] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!showServerSettings || !currentServer) return null

  const handleSave = async () => {
    if (currentServer && name !== currentServer.name) {
      try {
        await updateGuild(currentServer.id, { name })
        setHasChanges(false)
      } catch (err) {
        console.error("Failed to update guild", err)
      }
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this server? This action cannot be undone.')) {
      try {
        await deleteGuild(currentServer.id)
        setShowServerSettings(false)
      } catch (err) {
        console.error("Failed to delete guild", err)
      }
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>{currentServer.name}</span>
          </div>

          <div className={styles.navGroup}>
            <div className={styles.navLabel}>Settings</div>
            <div
              className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </div>
            <div
              className={`${styles.navItem} ${activeTab === 'roles' ? styles.active : ''}`}
              onClick={() => setActiveTab('roles')}
            >
              Roles
            </div>
          </div>

          <div className={styles.navGroup}>
            <div className={styles.navLabel}>Community</div>
            <div
              className={`${styles.navItem} ${activeTab === 'webhooks' ? styles.active : ''}`}
              onClick={() => setActiveTab('webhooks')}
            >
              Webhooks
            </div>
            <div
              className={`${styles.navItem} ${activeTab === 'auditlog' ? styles.active : ''}`}
              onClick={() => setActiveTab('auditlog')}
            >
              Audit Log
            </div>
          </div>

          <div className={styles.separator} />

          <div
            className={`${styles.navItem} ${styles.danger}`}
            onClick={handleDelete}
          >
            <span>Delete Server</span>
            <Trash2 size={14} />
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <h2>{activeTab === 'overview' ? 'Server Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
            <button className={styles.closeButton} onClick={() => setShowServerSettings(false)}>
              <X size={24} />
            </button>
          </div>

          <div className={styles.contentBody}>
            {activeTab === 'overview' && (
              <div className={styles.overviewSection}>
                <div className={styles.avatarRow}>
                  <div className={styles.avatarPreview}>
                    <img
                      src={currentServer.icon || `https://api.dicebear.com/7.x/initials/svg?seed=${currentServer.name}`}
                      alt="Server Icon"
                    />
                    <div className={styles.avatarOverlay} onClick={() => fileInputRef.current?.click()}>
                      <Upload size={24} />
                      <span>CHANGE ICON</span>
                    </div>
                  </div>
                  <div className={styles.avatarHint}>
                    We recommend an image of at least 512x512 for the server.
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept="image/*"
                    onChange={() => { }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>SERVER NAME</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setHasChanges(true)
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'roles' && (
              <div className={styles.emptyState}>
                <p>Role management is coming in the next update.</p>
              </div>
            )}

            {activeTab === 'webhooks' && (
              <WebhooksManager
                embedded
                guildId={currentServer.id}
                channels={(currentServer.channels || []).filter((c: any) => {
                  const t = String(c.type).toLowerCase()
                  return t === 'text' || t === '0' || c.type === 0
                }).map((c: any) => ({ id: c.id, name: c.name, type: 'text' }))}
                onClose={() => setActiveTab('overview')}
              />
            )}

            {activeTab === 'auditlog' && (
              <AuditLogModal
                guildId={currentServer.id}
                onClose={() => setActiveTab('overview')}
                embedded
              />
            )}
          </div>

          {hasChanges && (
            <div className={styles.saveNotice}>
              <span>Careful — you have unsaved changes!</span>
              <div className={styles.saveActions}>
                <button className={styles.resetBtn} onClick={() => { setName(currentServer.name); setHasChanges(false); }}>Reset</button>
                <button className={styles.saveBtn} onClick={handleSave}>Save Changes</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
