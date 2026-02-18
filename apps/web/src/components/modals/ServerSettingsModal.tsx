import { useState, useEffect } from 'react'
import { Plus, Settings, Users, Shield, Hash, Volume2, X, Trash2, Edit2, ExternalLink, History, Zap } from 'lucide-react'
import { useServerStore } from '../../stores/useServerStore'
import { useUserListStore } from '../../stores/useUserListStore'
import { Button, Input, Modal, AvatarUpload } from '../ui'
import { useToast } from '../ui'
import { api } from '../../lib/api'
import styles from './ServerSettingsModal.module.css'

interface ServerSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsTab = 'overview' | 'channels' | 'members' | 'roles' | 'moderation' | 'audit_logs' | 'webhooks'

export function ServerSettingsModal({ isOpen, onClose }: ServerSettingsModalProps) {
  const { currentServer, updateGuild, deleteGuild } = useServerStore()
  const { users } = useUserListStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('overview')
  const [serverName, setServerName] = useState(currentServer?.name || '')
  const [loading, setLoading] = useState(false)
  const [kickedMemberIds, setKickedMemberIds] = useState<Set<string>>(new Set())
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [webhooks, setWebhooks] = useState<any[]>([])
  const toast = useToast()

  if (!currentServer) return null

  const fetchAuditLogs = async () => {
     try {
       const { data } = await api.get(`/audit-logs/${currentServer.id}`)
       setAuditLogs(data)
     } catch (e) {
       console.error(e)
     }
  }

  const fetchWebhooks = async () => {
    try {
      const { data } = await api.get(`/webhooks/guild/${currentServer.id}`)
      setWebhooks(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (activeTab === 'audit_logs') {
      fetchAuditLogs()
    } else if (activeTab === 'webhooks') {
      fetchWebhooks()
    }
  }, [activeTab, currentServer.id])

  const channels = currentServer.channels || []
  // Build members list from currentServer.members (fall back to user list for details)
  const serverMembers = (currentServer.members || [])
    .filter((m: any) => !kickedMemberIds.has(m.userId))
    .map((m: any) => {
      const user = users.get(m.userId)
      return {
        id: m.userId,
        username: user?.username || user?.id || m.userId,
        avatar: user?.avatar || null,
        status: user?.status || 'offline',
      }
    })
    .slice(0, 50)

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

  const handleKickMember = (userId: string) => {
    if (!currentServer) return
    if (!window.confirm('Kick this member from the server?')) return
    setKickedMemberIds(prev => new Set([...prev, userId]))
    toast.success('Member kicked')
  }

  const handlePromoteMember = (_userId: string) => {
    toast.success('Role management coming soon')
  }

  // Placeholder create channel flow is triggered inline where needed

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
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
                      onUpload={() => {}} 
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

            {activeTab === 'members' && (
              <div className={styles.section}>
                <h2 className={styles.headerTitle}>Server Members</h2>
                <div className={styles.settingsList}>
                  {serverMembers.map(member => (
                    <div key={member.id} className={styles.listItem}>
                      <div className={styles.listItemMain}>
                        <img src={member.avatar || undefined} className={styles.memberAvatar} alt="" />
                        <div className={styles.listItemInfo}>
                          <span className={styles.itemName}>{member.username}</span>
                          <span className={styles.itemSub}>{member.status || 'Offline'}</span>
                        </div>
                      </div>
                      <div className={styles.listItemActions}>
                        <button className={styles.iconBtn} title="Promote" onClick={() => handlePromoteMember(member.id)}>
                          <Shield size={16} className={styles.roleIcon} />
                        </button>
                        <button className={styles.iconBtn} title="Kick" onClick={() => handleKickMember(member.id)}>
                          <Trash2 size={16} />
                        </button>
                        <button className={styles.iconBtn}><ExternalLink size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'audit_logs' && (
              <div className={styles.section}>
                <h2 className={styles.headerTitle}>Audit Log</h2>
                <div className={styles.settingsList}>
                  {auditLogs.length === 0 ? (
                    <p className={styles.emptyText}>No audit logs found for this server.</p>
                  ) : (
                    auditLogs.map(log => (
                      <div key={log.id} className={styles.listItem}>
                        <div className={styles.listItemInfo}>
                          <span className={styles.itemName}>{log.action}</span>
                          <span className={styles.itemSub}>
                            By {users.get(log.userId)?.username || log.userId} • {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'webhooks' && (
              <div className={styles.section}>
                <div className={styles.headerRow}>
                  <h2 className={styles.headerTitle}>Webhooks</h2>
                  <Button variant="primary" size="sm" onClick={() => toast.success('Webhook creation coming soon')}>
                    <Plus size={16} />
                    Create Webhook
                  </Button>
                </div>
                <div className={styles.settingsList}>
                  {webhooks.length === 0 ? (
                    <p className={styles.emptyText}>No webhooks configured for this server.</p>
                  ) : (
                    webhooks.map(wh => (
                      <div key={wh.id} className={styles.listItem}>
                        <div className={styles.listItemInfo}>
                          <span className={styles.itemName}>{wh.name}</span>
                          <span className={styles.itemSub}>Channel: {currentServer.channels?.find(c => c.id === wh.channelId)?.name || wh.channelId}</span>
                        </div>
                        <div className={styles.listItemActions}>
                          <button className={styles.iconBtn} onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/${wh.id}/${wh.token}`)
                            toast.success('Webhook URL copied')
                          }}>
                            <ExternalLink size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
