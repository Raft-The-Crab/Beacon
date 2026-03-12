import { useState, useEffect } from 'react'
import { Plus, Settings, Users, Shield, Hash, Volume2, X, Trash2, Edit2, History, Zap, Smile } from 'lucide-react'
import { useServerStore } from '../../stores/useServerStore'
import { Button, Input, Modal, AvatarUpload } from '../ui'
import { useToast } from '../ui'
import { RoleManager } from '../features/RoleManager'
import ModerationManager from '../features/ModerationManager'
import AssetManager from '../features/AssetManager'
import WebhooksManager from './WebhooksManager'
import { AuditLogModal } from './AuditLogModal'
import { SoundManager } from '../features/SoundManager'
import { useRolesStore } from '../../stores/useRolesStore'
import styles from '../../styles/modules/modals/ServerSettingsModal.module.css'

interface ServerSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsTab = 'overview' | 'channels' | 'members' | 'roles' | 'moderation' | 'audit_logs' | 'webhooks' | 'assets' | 'soundboard'

export function ServerSettingsModal({ isOpen, onClose }: ServerSettingsModalProps) {
  const { currentServer, updateGuild, deleteGuild } = useServerStore()
  const { fetchRoles } = useRolesStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('overview')
  const [serverName, setServerName] = useState(currentServer?.name || '')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  if (!currentServer) return null

  useEffect(() => {
    if (activeTab === 'roles') {
      fetchRoles(currentServer.id)
    }
  }, [activeTab, currentServer.id, fetchRoles])

  const channels = currentServer.channels || []

  const handleUpdateServer = async () => {
    setLoading(true)
    try {
      await updateGuild(currentServer.id, { name: serverName })
      toast.success('Server settings saved')
    } catch (error) {
      toast.error('Failed to update server')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteServer = () => {
    if (window.confirm(`Are you sure you want to delete ${currentServer.name}? This action cannot be undone.`)) {
      deleteGuild(currentServer.id)
      onClose()
      toast.success('Server deleted')
    }
  }

  // Placeholder create channel flow is triggered inline where needed

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" transparent noPadding hideHeader>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitle}>{currentServer.name}</div>
          </div>
          <div className={styles.sidebarContent}>
            <button
              className={`${styles.sidebarItem} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Settings size={18} />
              Overview
            </button>
            <button
              className={`${styles.sidebarItem} ${activeTab === 'channels' ? styles.active : ''}`}
              onClick={() => setActiveTab('channels')}
            >
              <Hash size={18} />
              Channels
            </button>
            <button
              className={`${styles.sidebarItem} ${activeTab === 'roles' ? styles.active : ''}`}
              onClick={() => setActiveTab('roles')}
            >
              <Shield size={18} />
              Roles
            </button>
            <button
              className={`${styles.sidebarItem} ${activeTab === 'assets' ? styles.active : ''}`}
              onClick={() => setActiveTab('assets')}
            >
              <Smile size={18} />
              Emojis & Stickers
            </button>
            <button
              className={`${styles.sidebarItem} ${activeTab === 'audit_logs' ? styles.active : ''}`}
              onClick={() => setActiveTab('audit_logs')}
            >
              <History size={18} />
              Audit Log
            </button>
            <button
              className={`${styles.sidebarItem} ${activeTab === 'webhooks' ? styles.active : ''}`}
              onClick={() => setActiveTab('webhooks')}
            >
              <Zap size={18} />
              Webhooks
            </button>
            <button
              className={`${styles.sidebarItem} ${activeTab === 'soundboard' ? styles.active : ''}`}
              onClick={() => setActiveTab('soundboard')}
            >
              <Volume2 size={18} />
              Soundboard
            </button>

            <div className={styles.sidebarSeparator} />
            <div className={styles.sidebarCategory}>User Management</div>
            <button
              className={`${styles.sidebarItem} ${activeTab === 'members' ? styles.active : ''}`}
              onClick={() => setActiveTab('members')}
            >
              <Users size={18} />
              Members
            </button>

            <div className={styles.sidebarSeparator} />
            <button
              className={styles.sidebarItemDanger}
              onClick={handleDeleteServer}
            >
              <Trash2 size={18} />
              Delete Server
            </button>
          </div>
        </div>

        <div className={styles.mainContent}>
          <button className={styles.escButton} onClick={onClose}>
            <div className={styles.escCircle}><X size={20} /></div>
            <span className={styles.escText}>ESC</span>
          </button>

          <div className={styles.scrollArea}>
            {activeTab === 'overview' && (
              <div className={styles.section}>
                <h2 className={styles.headerTitle}>Server Overview</h2>
                <div className={styles.overviewGrid}>
                  <div className={styles.avatarSection}>
                    <AvatarUpload
                      currentAvatar={currentServer.icon || undefined}
                      onUpload={() => { }}
                      size={128}
                    />
                    <p className={styles.uploadHint}>We recommend an image of at least 512x512 for the server.</p>
                  </div>
                  <div className={styles.formSection}>
                    <div className={styles.formGroup}>
                      <label>Server Name</label>
                      <Input
                        value={serverName}
                        onChange={(e) => setServerName(e.target.value)}
                        placeholder="Enter server name"
                      />
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleUpdateServer}
                      loading={loading}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'channels' && (
              <div className={styles.section}>
                <div className={styles.headerRow}>
                  <h2 className={styles.headerTitle}>Server Channels</h2>
                  <Button variant="primary" size="sm" onClick={() => toast.success('Create channel (placeholder)')}>
                    <Plus size={16} />
                    Create Channel
                  </Button>
                </div>
                <div className={styles.settingsList}>
                  {channels.map(channel => (
                    <div key={channel.id} className={styles.listItem}>
                      <div className={styles.listItemMain}>
                        <div className={styles.channelIcon}>
                          {channel.type === 'voice' ? <Volume2 size={20} /> : <Hash size={20} />}
                        </div>
                        <div className={styles.listItemInfo}>
                          <span className={styles.itemName}>{channel.name}</span>
                          <span className={styles.itemSub}>{channel.type} channel</span>
                        </div>
                      </div>
                      <div className={styles.listItemActions}>
                        <button className={styles.iconBtn} title="Edit Channel"><Edit2 size={16} /></button>
                        <button className={styles.iconBtnDanger} title="Delete Channel"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'roles' && (
              <div className={styles.section} style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
                <RoleManager serverId={currentServer.id} />
              </div>
            )}

            {activeTab === 'assets' && (
              <div className={styles.section} style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
                <AssetManager guildId={currentServer.id} />
              </div>
            )}

            {activeTab === 'members' && (
              <div className={styles.section} style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
                <ModerationManager guildId={currentServer.id} />
              </div>
            )}

            {activeTab === 'audit_logs' && (
              <div className={styles.section} style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
                <AuditLogModal
                  guildId={currentServer.id}
                  guildName={currentServer.name}
                  onClose={() => { }}
                  embedded
                />
              </div>
            )}

            {activeTab === 'webhooks' && (
              <div className={styles.section} style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
                <WebhooksManager
                  guildId={currentServer.id}
                  channels={currentServer.channels || []}
                  onClose={() => { }}
                  embedded
                />
              </div>
            )}

            {activeTab === 'soundboard' && (
              <div className={styles.section} style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
                <SoundManager guildId={currentServer.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
