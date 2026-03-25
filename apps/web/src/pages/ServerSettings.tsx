import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X, Upload, Trash2, Plus, Shield, Users, Globe, Ban, Lock, BarChart2, Webhook, FileText, Rocket, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../stores/useUIStore'
import { useServerStore } from '../stores/useServerStore'
import { useAuthStore } from '../stores/useAuthStore'
import { AuditLogModal } from '../components/modals/AuditLogModal'
import WebhooksManager from '../components/modals/WebhooksManager'
import { fileUploadService } from '../services/fileUpload'
import { Avatar, useToast, ConfirmModal, Select } from '../components/ui'
import { apiClient } from '../services/apiClient'
import { ServerBoosting } from '../components/features/ServerBoosting'
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
  | 'boost'

const TABS: { id: TabId; label: string; icon: React.ReactNode; group: string }[] = [
  { id: 'overview', label: 'Overview', icon: <Globe size={15} />, group: 'Settings' },
  { id: 'roles', label: 'Roles', icon: <Shield size={15} />, group: 'Settings' },
  { id: 'members', label: 'Members', icon: <Users size={15} />, group: 'Settings' },
  { id: 'boost', label: 'Server Boost', icon: <Rocket size={15} color="#f47fff" />, group: 'Settings' },
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

const AVAILABLE_PERMISSIONS = [
  { name: 'Administrator', bit: BigInt(8), desc: 'Bypasses all other permissions' },
  { name: 'Manage Server', bit: BigInt(32), desc: 'Allows changing server name, regions, and other settings' },
  { name: 'Manage Roles', bit: BigInt(268435456), desc: 'Allows modifying and deleting roles' },
  { name: 'Manage Channels', bit: BigInt(16), desc: 'Allows creating, editing, and deleting channels' },
  { name: 'Kick Members', bit: BigInt(2), desc: 'Allows removing members' },
  { name: 'Ban Members', bit: BigInt(4), desc: 'Allows permanently banning members' },
  { name: 'Manage Messages', bit: BigInt(8192), desc: 'Allows deleting other members\' messages' },
  { name: 'Send Messages', bit: BigInt(2048), desc: 'Allows sending text messages' },
]

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
  const [editingRole, setEditingRole] = useState<GuildRole | null>(null)

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void | Promise<void>
    variant?: 'danger' | 'primary' | 'info'
    confirmLabel?: string
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  })

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
        const link = `${window.location.origin}/invite/${created.code}`
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
    setConfirmConfig({
      isOpen: true,
      title: 'Kick Member',
      message: 'Are you sure you want to kick this member from the server?',
      variant: 'danger',
      confirmLabel: 'Kick',
      onConfirm: async () => {
        const res = await apiClient.kickMember(currentServer.id, userId)
        if (res.success) {
          await fetchGuild(currentServer.id)
          toast.success('Member kicked')
        } else {
          toast.error(res.error || 'Failed to kick member')
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleBanMember = async (userId: string) => {
    if (!currentServer) return
    setConfirmConfig({
      isOpen: true,
      title: 'Ban Member',
      message: 'Are you sure you want to ban this member from the server? They will not be able to rejoin unless unbanned.',
      variant: 'danger',
      confirmLabel: 'Ban',
      onConfirm: async () => {
        const res = await apiClient.banMember(currentServer.id, userId)
        if (res.success) {
          await fetchGuild(currentServer.id)
          toast.success('Member banned')
        } else {
          toast.error(res.error || 'Failed to ban member')
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleCreateRole = async (templateName?: string, templateColor?: string, templatePerms?: string) => {
    if (!currentServer) return
    const name = templateName || newRoleName.trim()
    if (!name) {
      toast.error('Role name is required')
      return
    }

    setCreatingRole(true)
    try {
      const res = await apiClient.createGuildRole(currentServer.id, {
        name,
        color: templateColor || '#99aab5',
        permissions: templatePerms || '0'
      })

      if (!res.success) {
        toast.error(res.error || 'Failed to create role')
        return
      }

      setRoles(prev => [res.data as GuildRole, ...prev])
      if (!templateName) setNewRoleName('')
      toast.success(`Role ${name} created successfully!`)
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
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Role',
      message: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete Role',
      onConfirm: async () => {
        const res = await apiClient.deleteGuildRole(currentServer.id, role.id)
        if (res.success) {
          setRoles(prev => prev.filter(r => r.id !== role.id))
          toast.success('Role deleted')
        } else {
          toast.error(res.error || 'Failed to delete role')
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleTogglePermission = async (role: GuildRole, bit: bigint) => {
    if (!currentServer) return
    const currentPerms = BigInt(role.permissions ?? "0")
    let newPerms = currentPerms
    if ((currentPerms & bit) === bit) {
      newPerms = currentPerms & ~bit
    } else {
      newPerms = currentPerms | bit
    }

    // Optimistic update
    setRoles(prev => prev.map(r => r.id === role.id ? { ...r, permissions: newPerms.toString() } : r))
    if (editingRole?.id === role.id) {
      setEditingRole({ ...role, permissions: newPerms.toString() })
    }

    try {
      await apiClient.updateGuildRole(currentServer.id, role.id, { permissions: newPerms.toString() })
    } catch {
      toast.error('Failed to update permissions')
      // Revert optimistic update
      setRoles(prev => prev.map(r => r.id === role.id ? { ...r, permissions: currentPerms.toString() } : r))
      if (editingRole?.id === role.id) {
        setEditingRole({ ...role, permissions: currentPerms.toString() })
      }
    }
  }

  const handleAssignRole = async (userId: string, roleId: string) => {
    if (!currentServer) return
    try {
      await apiClient.request('PUT', `/guilds/${currentServer.id}/members/${userId}/roles/${roleId}`)
      await fetchGuild(currentServer.id)
      toast.success('Role added')
    } catch {
      toast.error('Failed to add role')
    }
  }

  const handleRemoveRole = async (userId: string, roleId: string) => {
    if (!currentServer) return
    try {
      await apiClient.request('DELETE', `/guilds/${currentServer.id}/members/${userId}/roles/${roleId}`)
      await fetchGuild(currentServer.id)
      toast.success('Role removed')
    } catch (e: any) {
      toast.error('Failed to remove role')
    }
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
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Server',
      message: `Are you sure you want to delete "${currentServer.name}"? This action is permanent and cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete Server',
      onConfirm: async () => {
        try {
          await deleteGuild(currentServer.id)
          closeSettings()
          toast.success('Server deleted.')
        } catch {
          toast.error('Failed to delete server.')
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      }
    })
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
              <h2 className="premium-text-glow" style={{ fontSize: '28px', letterSpacing: '-0.02em' }}>
                {TABS.find((t) => t.id === activeTab)?.label}
              </h2>
              <div className={styles.headerDot} />
              <div className={styles.serverNameBadge}>
                {currentServer.name}
              </div>
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

                      <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Server ID</span>
                          <code className={styles.infoValue}>{currentServer.id}</code>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Owner ID</span>
                          <span className={styles.infoValue}>{currentServer.ownerId}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Created On</span>
                          <span className={styles.infoValue}>{new Date(currentServer.createdAt || '').toLocaleDateString()}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Member Count</span>
                          <span className={styles.infoValue}>{currentServer.memberCount ?? currentServer.members?.length ?? '—'} Citizens</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Roles ── */}
                {activeTab === 'roles' && (
                  <div>
                    {editingRole ? (
                      <div className={styles.editingRoleView}>
                        <button className={styles.backBtn} onClick={() => setEditingRole(null)}>
                          <ChevronLeft size={16} style={{ marginRight: 4 }} /> Back to Roles
                        </button>
                        <h3 style={{ marginTop: 16, marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 999, background: editingRole.color || '#99aab5', marginRight: 8 }} />
                          Editing Role: {editingRole.name}
                        </h3>
                        <p className={styles.tabIntro}>Toggle permissions for this role below.</p>

                        <div className={`${styles.settingGroup} glass-panel`} style={{ marginTop: 24 }}>
                          {AVAILABLE_PERMISSIONS.map(p => {
                            const currentPerms = BigInt(editingRole.permissions ?? "0")
                            const hasPerm = (currentPerms & p.bit) === p.bit
                            return (
                              <div key={p.name} className={styles.settingRow}>
                                <div>
                                  <div className={styles.settingLabel}>{p.name}</div>
                                  <div className={styles.settingDesc}>{p.desc}</div>
                                </div>
                                <label className="switch">
                                  <input type="checkbox" checked={hasPerm} onChange={() => handleTogglePermission(editingRole, p.bit)} />
                                  <span className="slider round"></span>
                                </label>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={styles.tabIntro}>
                          Create and manage role groups for your server members.
                        </p>
                        <div style={{ marginBottom: 24 }}>
                          <h3 style={{ marginBottom: 16 }}>Select a Template</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                             <div className={`${styles.roleTemplateCard} premium-glass-card glass-hover`} onClick={() => handleCreateRole('Admin', '#ff5252', '8')} style={{ padding: '24px', borderRadius: '18px', background: 'rgba(255,82,82,0.03)', cursor: 'pointer', border: '1px solid rgba(255,82,82,0.1)', transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)' }}>
                                <div style={{ background: 'rgba(255,82,82,0.12)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 8px 16px rgba(255,82,82,0.15)' }}>
                                  <Shield size={24} color="#ff5252" />
                                </div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#fff', fontWeight: 800 }}>Admin</h4>
                                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Full server authority and management capabilities.</p>
                             </div>
                             <div className={`${styles.roleTemplateCard} premium-glass-card glass-hover`} onClick={() => handleCreateRole('Moderator', '#5865f2', '268443654')} style={{ padding: '24px', borderRadius: '18px', background: 'rgba(88,101,242,0.03)', cursor: 'pointer', border: '1px solid rgba(88,101,242,0.1)', transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)' }}>
                                <div style={{ background: 'rgba(88,101,242,0.12)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 8px 16px rgba(88,101,242,0.15)' }}>
                                  <Users size={24} color="#5865f2" />
                                </div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#fff', fontWeight: 800 }}>Moderator</h4>
                                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Security oversight and member governance.</p>
                             </div>
                             <div className={`${styles.roleTemplateCard} premium-glass-card glass-hover`} onClick={() => handleCreateRole('Member', '#23a55a', '2048')} style={{ padding: '24px', borderRadius: '18px', background: 'rgba(35,165,90,0.03)', cursor: 'pointer', border: '1px solid rgba(35,165,90,0.1)', transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)' }}>
                                <div style={{ background: 'rgba(35,165,90,0.12)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 8px 16px rgba(35,165,90,0.15)' }}>
                                  <Globe size={24} color="#23a55a" />
                                </div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#fff', fontWeight: 800 }}>Member</h4>
                                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Standard communication and access profile.</p>
                             </div>
                             <div className={`${styles.roleTemplateCard} premium-glass-card glass-hover`} onClick={() => handleCreateRole('VIP', '#f47fff', '2048')} style={{ padding: '24px', borderRadius: '18px', background: 'rgba(244,127,255,0.03)', cursor: 'pointer', border: '1px solid rgba(244,127,255,0.1)', transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)' }}>
                                <div style={{ background: 'rgba(244,127,255,0.12)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 8px 16px rgba(244,127,255,0.15)' }}>
                                  <Rocket size={24} color="#f47fff" />
                                </div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#fff', fontWeight: 800 }}>VIP Booster</h4>
                                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Special recognition for platform supporters.</p>
                             </div>
                          </div>
                        </div>

                        <div className={`${styles.inviteCreate} glass-panel`}>
                          <div className={styles.inviteInfo}>
                            <span>Create a custom role</span>
                            <code className={styles.inviteCode}>Manually specify a name for a blank role.</code>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                              className={styles.input}
                              style={{ minWidth: 180 }}
                              placeholder="e.g. Content Creator"
                              value={newRoleName}
                              onChange={(e) => setNewRoleName(e.target.value)}
                              maxLength={100}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateRole() }}
                            />
                            <button className={styles.copyBtn} onClick={() => handleCreateRole()} disabled={creatingRole}>
                              {creatingRole ? '...' : 'Create'}
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
                                  <span className={styles.memberRole}>{AVAILABLE_PERMISSIONS.filter(p => (BigInt(role.permissions ?? "0") & p.bit) === p.bit).map(p => p.name).join(', ') || 'No Permissions'}</span>
                                </div>
                                <div className={styles.memberActions}>
                                  <button className={styles.memberBtn} onClick={() => setEditingRole(role)}>Edit</button>
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
                      </>
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
                              <div className={styles.memberRolesList} style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                {(m.roles || []).map((r: any) => (
                                  <span key={r.id} className={styles.memberRoleBadge} style={{ fontSize: 11, padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: 999, background: r.color || '#99aab5' }} />
                                    {r.name}
                                    <X size={10} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => handleRemoveRole(m.userId, r.id)} />
                                  </span>
                                ))}
                                {m.userId !== currentServer.ownerId && (
                                  <div className={styles.roleSelectWrapper} style={{ position: 'relative' }}>
                                    <Select
                                      className={styles.roleSelect}
                                      style={{ fontSize: 11, padding: '2px 6px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, cursor: 'pointer', width: 40 }}
                                      value=""
                                      onChange={(e) => handleAssignRole(m.userId, e.target.value)}
                                    >
                                      <option value="" disabled>+</option>
                                      {roles.filter(r => !(m.roles || []).some((mr: any) => mr.id === r.id) && r.name !== '@everyone').map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                      ))}
                                    </Select>
                                  </div>
                                )}
                              </div>
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
                      Protect your server with Beacon's advanced security suite. Configure automated moderation and content filters.
                    </p>
                    <div className={styles.moderationGrid}>
                      <div className={styles.moderationCard}>
                        <div className={styles.cardHeader}>
                          <div className={styles.cardIcon}><Shield size={20} /></div>
                          <label className="switch">
                            <input type="checkbox" defaultChecked />
                            <span className="slider round"></span>
                          </label>
                        </div>
                        <div>
                          <h4 className={styles.cardTitle}>Beacon AI Guard</h4>
                          <p className={styles.cardDesc}>Automatically detects and removes extreme toxicity, scams, and raid attempts using Beacon Intelligence.</p>
                        </div>
                      </div>

                      <div className={styles.moderationCard}>
                        <div className={styles.cardHeader}>
                          <div className={styles.cardIcon}><Globe size={20} /></div>
                          <label className="switch">
                            <input type="checkbox" />
                            <span className="slider round"></span>
                          </label>
                        </div>
                        <div>
                          <h4 className={styles.cardTitle}>Global Ban Sync</h4>
                          <p className={styles.cardDesc}>Synchronize your server's ban list with the Beacon Global Safety Network to pre-emptively block known bad actors.</p>
                        </div>
                      </div>

                      <div className={styles.moderationCard}>
                        <div className={styles.cardHeader}>
                          <div className={styles.cardIcon}><Lock size={20} /></div>
                          <label className="switch">
                            <input type="checkbox" defaultChecked />
                            <span className="slider round"></span>
                          </label>
                        </div>
                        <div>
                          <h4 className={styles.cardTitle}>Anti-Link System</h4>
                          <p className={styles.cardDesc}>Block unauthorized external links and phishing attempts. Whitelist trusted domains in the advanced settings.</p>
                        </div>
                      </div>

                      <div className={styles.moderationCard}>
                        <div className={styles.cardHeader}>
                          <div className={styles.cardIcon}><Users size={20} /></div>
                          <label className="switch">
                            <input type="checkbox" />
                            <span className="slider round"></span>
                          </label>
                        </div>
                        <div>
                          <h4 className={styles.cardTitle}>Alt Account Filter</h4>
                          <p className={styles.cardDesc}>Prevent newly created accounts (less than 1 day old) from joining your server to mitigate raid risk.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Insights ── */}
                {activeTab === 'insights' && (
                  <div>
                    <p className={styles.tabIntro}>
                      Analyze your server's growth and engagement metrics over the last 30 days.
                    </p>
                    <div className={styles.insightsGrid}>
                      <div className={styles.statCard}>
                        <span className={styles.statValue}>1,284</span>
                        <span className={styles.statLabel}>Messages Sent</span>
                      </div>
                      <div className={styles.statCard}>
                        <span className={styles.statValue}>42</span>
                        <span className={styles.statLabel}>New Members</span>
                      </div>
                      <div className={styles.statCard}>
                        <span className={styles.statValue}>890</span>
                        <span className={styles.statLabel}>Voice Minutes</span>
                      </div>
                    </div>

                    <h3 className={styles.settingGroupTitle} style={{ marginBottom: 16 }}>Engagement Trend</h3>
                    <div className={styles.chartContainer}>
                      <div className={styles.chartBar} style={{ height: '40%' }} />
                      <div className={styles.chartBar} style={{ height: '60%' }} />
                      <div className={styles.chartBar} style={{ height: '55%' }} />
                      <div className={styles.chartBar} style={{ height: '80%' }} />
                      <div className={styles.chartBar} style={{ height: '95%' }} />
                      <div className={styles.chartBar} style={{ height: '70%' }} />
                      <div className={styles.chartBar} style={{ height: '85%' }} />
                      <div className={styles.chartBar} style={{ height: '60%' }} />
                      <div className={styles.chartBar} style={{ height: '45%' }} />
                      <div className={styles.chartBar} style={{ height: '90%' }} />
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
                                  navigator.clipboard.writeText(`${window.location.origin}/invite/${inv.code}`)
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


                {/* ── Boost ── */}
                {activeTab === 'boost' && (
                  <ServerBoosting onClose={() => setActiveTab('overview')} />
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

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmLabel={confirmConfig.confirmLabel}
      />
    </div>
  )
}
