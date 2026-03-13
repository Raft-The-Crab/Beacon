import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X, Upload, Trash2, Plus, Shield, Users, Globe, Ban, Lock, BarChart2, Webhook, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../stores/useUIStore'
import { useServerStore } from '../stores/useServerStore'
import { useAuthStore } from '../stores/useAuthStore'
import { AuditLogModal } from '../components/modals/AuditLogModal'
import WebhooksManager from '../components/modals/WebhooksManager'
import { fileUploadService } from '../services/fileUpload'
import { Avatar, useToast } from '../components/ui'
import { apiClient } from '../services/apiClient'
import styles from '../styles/modules/pages/ServerSettings.module.css'

type TabId =
  | 'overview'
  | 'roles'
  | 'members'
  | 'moderation'
  | 'invites'
  | 'bans'
  | 'webhooks'
  | 'auditlog'
  | 'insights'

const TABS: { id: TabId; label: string; icon: React.ReactNode; group: string }[] = [
  { id: 'overview', label: 'Overview', icon: <Globe size={15} />, group: 'Settings' },
  { id: 'roles', label: 'Roles', icon: <Shield size={15} />, group: 'Settings' },
  { id: 'members', label: 'Members', icon: <Users size={15} />, group: 'Settings' },
  { id: 'moderation', label: 'Moderation', icon: <Ban size={15} />, group: 'Community' },
  { id: 'invites', label: 'Invites', icon: <Plus size={15} />, group: 'Community' },
  { id: 'bans', label: 'Bans', icon: <Lock size={15} />, group: 'Community' },
  { id: 'webhooks', label: 'Webhooks', icon: <Webhook size={15} />, group: 'Integrations' },
  { id: 'auditlog', label: 'Audit Log', icon: <FileText size={15} />, group: 'Integrations' },
  { id: 'insights', label: 'Insights', icon: <BarChart2 size={15} />, group: 'Integrations' },
]

type GuildRole = {
  id: string
  name: string
  color?: string | null
  permissions?: string
  position?: number
}

export function ServerSettings() {
  const navigate = useNavigate()
  const { serverId: routeServerId } = useParams<{ serverId: string }>()
  const { showServerSettings, setShowServerSettings } = useUIStore()
  const { currentServer, updateGuild, deleteGuild, setCurrentServer, fetchGuild } = useServerStore()
  const user = useAuthStore((s: any) => s.user)
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [name, setName] = useState(currentServer?.name || '')
  const [hasChanges, setHasChanges] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // -- State for Live Sub-Views --
  const [invites, setInvites] = useState<any[]>([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [bans, setBans] = useState<any[]>([])
  const [loadingBans, setLoadingBans] = useState(false)
  const [roles, setRoles] = useState<GuildRole[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [creatingRole, setCreatingRole] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')

  const isRouteMode = !!routeServerId
  const isOpen = isRouteMode || showServerSettings

  useEffect(() => {
    if (!routeServerId) return
    if (!currentServer || currentServer.id !== routeServerId) {
      setCurrentServer(routeServerId)
      fetchGuild(routeServerId).catch(() => {
        // Ignore fetch errors here; the UI below will show empty state feedback.
      })
    }
  }, [routeServerId, currentServer, setCurrentServer, fetchGuild])

  const closeSettings = () => {
    if (isRouteMode) {
      navigate(`/channels/${routeServerId}`)
      return
    }
    setShowServerSettings(false)
  }

  // Fetch logic based on active tab
  useEffect(() => {
    if (!currentServer) return
    if (activeTab === 'invites') {
      setLoadingInvites(true)
      apiClient.getInvites(currentServer.id).then(res => {
        if (res.success) setInvites(res.data)
      }).finally(() => setLoadingInvites(false))
    }
    if (activeTab === 'bans') {
      setLoadingBans(true)
      apiClient.getBans(currentServer.id).then(res => {
        if (res.success) setBans(res.data)
      }).finally(() => setLoadingBans(false))
    }
    if (activeTab === 'roles') {
      setLoadingRoles(true)
      apiClient.getGuildRoles(currentServer.id).then(res => {
        if (res.success) {
          setRoles(Array.isArray(res.data) ? res.data : [])
        }
      }).finally(() => setLoadingRoles(false))
    }
  }, [activeTab, currentServer])

  const handleRevokeInvite = async (code: string) => {
    if (!currentServer) return
    const res = await apiClient.deleteInvite(currentServer.id, code)
    if (res.success) {
      setInvites(prev => prev.filter((inv: any) => inv.code !== code))
      toast.success('Invite revoked')
    } else {
      toast.error('Failed to revoke invite')
    }
  }

  const handleCreateInvite = async () => {
    if (!currentServer) return
    setCreatingInvite(true)
    try {
      const res = await apiClient.createInvite(currentServer.id)
      if (res.success && res.data?.code) {
        const created = res.data
        setInvites(prev => [created, ...prev.filter((inv: any) => inv.code !== created.code)])
        const link = `https://beacon.qzz.io/invite/${created.code}`
        navigator.clipboard.writeText(link)
        toast.success('Invite created and copied')
      } else {
        toast.error('Failed to create invite')
      }
    } catch {
      toast.error('Failed to create invite')
    } finally {
      setCreatingInvite(false)
    }
  }

  const handleUnban = async (userId: string) => {
    if (!currentServer) return
    const res = await apiClient.unbanMember(currentServer.id, userId)
    if (res.success) {
      setBans(prev => prev.filter((b: any) => b.userId !== userId))
      toast.success('User unbanned')
    } else {
      toast.error('Failed to unban user')
    }
  }

  const handleKickMember = async (userId: string) => {
    if (!currentServer) return
    if (!confirm('Kick this member from the server?')) return

    const res = await apiClient.kickMember(currentServer.id, userId)
    if (res.success) {
      await fetchGuild(currentServer.id)
      toast.success('Member kicked')
      return
    }
    toast.error(res.error || 'Failed to kick member')
  }

  const handleBanMember = async (userId: string) => {
    if (!currentServer) return
    if (!confirm('Ban this member from the server?')) return

    const res = await apiClient.banMember(currentServer.id, userId)
    if (res.success) {
      await fetchGuild(currentServer.id)
      toast.success('Member banned')
      return
    }
    toast.error(res.error || 'Failed to ban member')
  }

  const handleCreateRole = async () => {
    if (!currentServer) return
    const name = newRoleName.trim()
    if (!name) {
      toast.error('Role name is required')
      return
    }

    setCreatingRole(true)
    try {
      const res = await apiClient.createGuildRole(currentServer.id, {
        name,
        color: '#99aab5',
        permissions: '0'
      })

      if (!res.success) {
        toast.error(res.error || 'Failed to create role')
        return
      }

      setRoles(prev => [res.data as GuildRole, ...prev])
      setNewRoleName('')
      toast.success('Role created')
    } finally {
      setCreatingRole(false)
    }
  }

  const handleDeleteRole = async (role: GuildRole) => {
    if (!currentServer) return
    if (role.name === '@everyone') {
      toast.error('Cannot delete @everyone role')
      return
    }
    if (!confirm(`Delete role "${role.name}"?`)) return

    const res = await apiClient.deleteGuildRole(currentServer.id, role.id)
    if (!res.success) {
      toast.error(res.error || 'Failed to delete role')
      return
    }

    setRoles(prev => prev.filter(r => r.id !== role.id))
    toast.success('Role deleted')
  }

  if (!isOpen) return null

  if (!currentServer) {
    return (
      <div className={styles.overlay} onClick={closeSettings}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={styles.container}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.content}>
            <div className={styles.contentHeader}>
              <div className={styles.headerTitle}>
                <h2>Server Settings</h2>
              </div>
              <button className={`${styles.closeButton} glass-hover`} onClick={closeSettings}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.emptyState}>
              <h3>Loading server...</h3>
              <p>If this server does not exist, go back and select another server.</p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  const handleSave = async () => {
    if (currentServer && name !== currentServer.name) {
      try {
        await updateGuild(currentServer.id, { name })
        setHasChanges(false)
        toast.success('Server updated!')
      } catch {
        toast.error('Failed to update server.')
      }
    }
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${currentServer.name}"? This cannot be undone.`)) {
      try {
        await deleteGuild(currentServer.id)
        closeSettings()
        toast.success('Server deleted.')
      } catch {
        toast.error('Failed to delete server.')
      }
    }
  }

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingIcon(true)
    try {
      const uploaded = await fileUploadService.uploadFile(file)
      await updateGuild(currentServer.id, { icon: uploaded.url })
      toast.success('Server icon updated!')
    } catch {
      toast.error('Failed to upload icon.')
    } finally {
      setUploadingIcon(false)
    }
  }

  const isOwner = currentServer.ownerId === user?.id

  // Group tabs
  const groups = ['Settings', 'Community', 'Integrations']

  return (
    <div className={styles.overlay} onClick={closeSettings}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={styles.container} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitle}>{currentServer.name}</div>
            <div className={styles.sidebarSub}>{isOwner ? 'Owner' : 'Administrator'}</div>
          </div>

          {groups.map((group) => {
            const groupTabs = TABS.filter((t) => t.group === group)
            return (
              <div key={group} className={styles.navGroup}>
                <div className={styles.navLabel}>{group}</div>
                {groupTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            )
          })}

          <div className={styles.separator} />

          {isOwner && (
            <button className={`${styles.navItem} ${styles.danger}`} onClick={handleDelete}>
              <Trash2 size={15} />
              Delete Server
            </button>
          )}
        </div>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <div className={styles.headerTitle}>
              <h2 className="premium-text-glow">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h2>
              <div className={styles.headerDot} />
              <span className={styles.serverNameBadge}>{currentServer.name}</span>
            </div>
            <button className={`${styles.closeButton} glass-hover`} onClick={closeSettings}>
              <X size={20} />
            </button>
          </div>

          <div className={styles.contentBody}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {/* ── Overview ── */}
                {activeTab === 'overview' && (
                  <div className={styles.overviewSection}>
                    <div className={styles.avatarRow}>
                      <div className={styles.avatarPreview}>
                        {uploadingIcon ? (
                          <div className={styles.uploadingSpinner} />
                        ) : (
                          <Avatar
                            src={currentServer.icon && !currentServer.icon.includes('dicebear') ? currentServer.icon : undefined}
                            username={currentServer.name}
                            size="lg"
                          />
                        )}
                        <div className={styles.avatarOverlay} onClick={() => fileInputRef.current?.click()}>
                          <Upload size={20} />
                          <span>CHANGE</span>
                        </div>
                      </div>
                      <div className={styles.avatarHintBlock}>
                        <p className={styles.avatarHintTitle}>Server Icon</p>
                        <p className={styles.avatarHint}>Recommended: 512×512 PNG or JPG</p>
                        <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                          <Upload size={14} /> Upload Image
                        </button>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        hidden
                        accept="image/*"
                        onChange={handleIconUpload}
                      />
                    </div>

                    <div className={styles.formSection}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>SERVER NAME</label>
                        <input
                          className={styles.input}
                          type="text"
                          value={name}
                          maxLength={100}
                          onChange={(e) => { setName(e.target.value); setHasChanges(true) }}
                        />
                      </div>

                      <div className={styles.infoRow}>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Server ID</span>
                          <code className={styles.infoValue}>{currentServer.id}</code>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Owner</span>
                          <span className={styles.infoValue}>{currentServer.ownerId}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Created</span>
                          <span className={styles.infoValue}>{new Date(currentServer.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Members</span>
                          <span className={styles.infoValue}>{currentServer.memberCount ?? currentServer.members?.length ?? '—'} Unit</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Roles ── */}
                {activeTab === 'roles' && (
                  <div>
                    <p className={styles.tabIntro}>
                      Create and manage role groups for your server members.
                    </p>
                    <div className={`${styles.inviteCreate} glass-panel`}>
                      <div className={styles.inviteInfo}>
                        <span>Create a new role</span>
                        <code className={styles.inviteCode}>Roles control permission bundles and hierarchy.</code>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          className={styles.input}
                          style={{ minWidth: 180 }}
                          placeholder="Role name"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          maxLength={100}
                        />
                        <button className={styles.copyBtn} onClick={handleCreateRole} disabled={creatingRole}>
                          {creatingRole ? 'Creating...' : 'Create Role'}
                        </button>
                      </div>
                    </div>

                    {loadingRoles ? (
                      <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>Loading roles...</p>
                    ) : roles.length === 0 ? (
                      <div className={styles.emptyState}>
                        <Shield size={48} className={styles.emptyIcon} />
                        <h3>No roles found</h3>
                        <p>Create your first role to start assigning permissions.</p>
                      </div>
                    ) : (
                      <div className={styles.memberList} style={{ marginTop: 16 }}>
                        {roles.map((role) => (
                          <div key={role.id} className={`${styles.memberRow} glass-hover`}>
                            <div className={styles.memberInfo}>
                              <span className={styles.memberName}>
                                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: role.color || '#99aab5', marginRight: 8 }} />
                                {role.name}
                              </span>
                              <span className={styles.memberRole}>Permissions: {String(role.permissions ?? '0')}</span>
                            </div>
                            <div className={styles.memberActions}>
                              <button
                                className={`${styles.memberBtn} ${styles.memberBtnDanger}`}
                                onClick={() => handleDeleteRole(role)}
                                disabled={role.name === '@everyone'}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Members ── */}
                {activeTab === 'members' && (
                  <div>
                    <p className={styles.tabIntro}>
                      Manage who's in your server. You can kick, ban, or assign roles to members.
                    </p>
                    {(currentServer.members ?? []).length === 0 ? (
                      <div className={styles.emptyState}>
                        <Users size={40} className={styles.emptyIcon} />
                        <h3>No member data loaded</h3>
                        <p>Member data loads when you open the server. Try refreshing.</p>
                      </div>
                    ) : (
                      <div className={styles.memberList}>
                        {(currentServer.members ?? []).map((m: any) => (
                          <div key={m.id} className={`${styles.memberRow} glass-hover`}>
                            <Avatar
                              src={m.user?.avatar && !m.user.avatar.includes('dicebear') ? m.user.avatar : undefined}
                              username={m.user?.username || m.userId}
                              size="sm"
                            />
                            <div className={styles.memberInfo}>
                              <span className={styles.memberName}>{m.user?.username || m.userId}</span>
                              <span className={styles.memberRole}>{m.roles?.[0]?.name || 'Member'}</span>
                            </div>
                            {m.userId !== currentServer.ownerId && (
                              <div className={styles.memberActions}>
                                <button className={styles.memberBtn} onClick={() => handleKickMember(m.userId)}>Kick</button>
                                <button className={`${styles.memberBtn} ${styles.memberBtnDanger}`} onClick={() => handleBanMember(m.userId)}>Ban</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Moderation ── */}
                {activeTab === 'moderation' && (
                  <div>
                    <p className={styles.tabIntro}>
                      Keep your community safe. Configure auto-mod rules, filters, and slowmode.
                    </p>
                    <div className={`${styles.settingGroup} glass-panel`}>
                      <h3 className={styles.settingGroupTitle}>Auto-Moderation</h3>
                      <div className={styles.settingRow}>
                        <div>
                          <div className={styles.settingLabel}>Spam Filter</div>
                          <div className={styles.settingDesc}>Auto-delete repeated messages from the same user</div>
                        </div>
                        <div className={styles.comingSoonBadge}>Soon</div>
                      </div>
                      <div className={styles.settingRow}>
                        <div>
                          <div className={styles.settingLabel}>Profanity Filter</div>
                          <div className={styles.settingDesc}>Block messages with common slurs and offensive words</div>
                        </div>
                        <div className={styles.comingSoonBadge}>Soon</div>
                      </div>
                      <div className={styles.settingRow}>
                        <div>
                          <div className={styles.settingLabel}>Link Filter</div>
                          <div className={styles.settingDesc}>Block or warn on messages containing external links</div>
                        </div>
                        <div className={styles.comingSoonBadge}>Soon</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Invites ── */}
                {activeTab === 'invites' && (
                  <div>
                    <p className={styles.tabIntro}>
                      Create and manage invite links for your server.
                    </p>
                    <div className={`${styles.inviteCreate} glass-panel`}>
                      <div className={styles.inviteInfo}>
                        <span>Create a new server invite</span>
                        <code className={styles.inviteCode}>Invite links expire after 7 days by default.</code>
                      </div>
                      <button
                        className={styles.copyBtn}
                        onClick={handleCreateInvite}
                        disabled={creatingInvite}
                      >
                        {creatingInvite ? 'Creating...' : 'Create + Copy'}
                      </button>
                    </div>

                    <h3 className={styles.settingGroupTitle} style={{ marginTop: 24, marginBottom: 16 }}>Active Invites</h3>
                    {loadingInvites ? (
                      <p style={{ color: 'var(--text-muted)' }}>Loading invites...</p>
                    ) : invites.length === 0 ? (
                      <div className={styles.emptyState}>
                        <Plus size={36} className={styles.emptyIcon} />
                        <h3>No Active Invites</h3>
                        <p>There are no active custom invite links for this server right now.</p>
                      </div>
                    ) : (
                      <div className={styles.memberList}>
                        {invites.map((inv: any) => (
                          <div key={inv.code} className={`${styles.memberRow} glass-hover`}>
                            <div className={styles.memberInfo}>
                              <span className={styles.memberName}>{inv.code}</span>
                              <span className={styles.memberRole}>Created by {inv.inviter?.username || inv.inviterId} • Uses: {inv.uses}/{inv.maxUses || '∞'}</span>
                            </div>
                            <div className={styles.memberActions}>
                              <button
                                className={styles.memberBtn}
                                onClick={() => {
                                  navigator.clipboard.writeText(`https://beacon.qzz.io/invite/${inv.code}`)
                                  toast.success('Invite link copied!')
                                }}
                              >
                                Copy
                              </button>
                              <button
                                className={`${styles.memberBtn} ${styles.memberBtnDanger}`}
                                onClick={() => handleRevokeInvite(inv.code)}
                              >
                                <X size={14} style={{ marginRight: 4 }} /> Revoke
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Bans ── */}
                {activeTab === 'bans' && (
                  <div>
                    <p className={styles.tabIntro}>
                      Users you've banned can't see or join your server.
                    </p>
                    {loadingBans ? (
                      <p style={{ color: 'var(--text-muted)' }}>Loading bans...</p>
                    ) : bans.length === 0 ? (
                      <div className={styles.emptyState}>
                        <Lock size={40} className={styles.emptyIcon} />
                        <h3>No bans yet</h3>
                        <p>When you ban someone, they'll show up here. You can unban them any time.</p>
                      </div>
                    ) : (
                      <div className={styles.memberList}>
                        {bans.map((ban: any) => (
                          <div key={ban.userId} className={`${styles.memberRow} glass-hover`}>
                            <Avatar
                              src={ban.user?.avatar && !ban.user.avatar.includes('dicebear') ? ban.user.avatar : undefined}
                              username={ban.user?.username || ban.userId}
                              size="sm"
                            />
                            <div className={styles.memberInfo}>
                              <span className={styles.memberName}>{ban.user?.username || ban.userId}</span>
                              {ban.reason && <span className={styles.memberRole}>Reason: {ban.reason}</span>}
                            </div>
                            <div className={styles.memberActions}>
                              <button
                                className={`${styles.memberBtn}`}
                                onClick={() => handleUnban(ban.userId)}
                              >
                                Revoke Ban
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Webhooks ── */}
                {activeTab === 'webhooks' && (
                  <WebhooksManager
                    embedded
                    guildId={currentServer.id}
                    channels={(currentServer.channels || [])
                      .filter((c: any) => {
                        const t = String(c.type).toLowerCase()
                        return t === 'text' || t === '0' || c.type === 0
                      })
                      .map((c: any) => ({ id: c.id, name: c.name, type: 'text' }))}
                    onClose={() => setActiveTab('overview')}
                  />
                )}

                {/* ── Audit Log ── */}
                {activeTab === 'auditlog' && (
                  <AuditLogModal
                    guildId={currentServer.id}
                    onClose={() => setActiveTab('overview')}
                    embedded
                  />
                )}

                {/* ── Insights ── */}
                {activeTab === 'insights' && (
                  <div>
                    <p className={styles.tabIntro}>
                      Server activity and growth stats.
                    </p>
                    <div className={styles.insightGrid}>
                      <div className={`${styles.insightCard} glass-panel`}>
                        <div className={styles.insightValue}>{currentServer.memberCount ?? currentServer.members?.length ?? 0}</div>
                        <div className={styles.insightLabel}>Total Members</div>
                      </div>
                      <div className={`${styles.insightCard} glass-panel`}>
                        <div className={styles.insightValue}>{currentServer.channels?.length ?? 0}</div>
                        <div className={styles.insightLabel}>Channels</div>
                      </div>
                      <div className={`${styles.insightCard} glass-panel`}>
                        <div className={styles.insightValue}>—</div>
                        <div className={styles.insightLabel}>Messages Today</div>
                      </div>
                      <div className={`${styles.insightCard} glass-panel`}>
                        <div className={styles.insightValue}>—</div>
                        <div className={styles.insightLabel}>Active Now</div>
                      </div>
                    </div>
                    <div className={styles.emptyState} style={{ marginTop: 24 }}>
                      <BarChart2 size={40} className={styles.emptyIcon} />
                      <h3>Detailed analytics</h3>
                      <p>Live totals are shown above. Historical analytics can be accessed from the audit logs and moderation events stream.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Save bar */}
          {hasChanges && (
            <div className={styles.saveNotice}>
              <span>You have unsaved changes</span>
              <div className={styles.saveActions}>
                <button className={styles.resetBtn} onClick={() => { setName(currentServer.name); setHasChanges(false) }}>
                  Reset
                </button>
                <button className={styles.saveBtn} onClick={handleSave}>
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
