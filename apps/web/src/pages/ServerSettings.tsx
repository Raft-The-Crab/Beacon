import { useState, useRef } from 'react'
import { X, Upload, Trash2, Plus, Shield, Users, Globe, Bell, Ban, Lock, BarChart2, Webhook, FileText } from 'lucide-react'
import { useUIStore } from '../stores/useUIStore'
import { useServerStore } from '../stores/useServerStore'
import { useAuthStore } from '../stores/useAuthStore'
import { AuditLogModal } from '../components/modals/AuditLogModal'
import WebhooksManager from '../components/modals/WebhooksManager'
import { fileUploadService } from '../services/fileUpload'
import { useToast } from '../components/ui/Toast'
import styles from './ServerSettings.module.css'

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
  { id: 'overview',    label: 'Overview',    icon: <Globe size={15} />,     group: 'Settings' },
  { id: 'roles',       label: 'Roles',       icon: <Shield size={15} />,    group: 'Settings' },
  { id: 'members',     label: 'Members',     icon: <Users size={15} />,     group: 'Settings' },
  { id: 'moderation',  label: 'Moderation',  icon: <Ban size={15} />,       group: 'Community' },
  { id: 'invites',     label: 'Invites',     icon: <Plus size={15} />,      group: 'Community' },
  { id: 'bans',        label: 'Bans',        icon: <Lock size={15} />,      group: 'Community' },
  { id: 'webhooks',    label: 'Webhooks',    icon: <Webhook size={15} />,   group: 'Integrations' },
  { id: 'auditlog',    label: 'Audit Log',   icon: <FileText size={15} />,  group: 'Integrations' },
  { id: 'insights',    label: 'Insights',    icon: <BarChart2 size={15} />, group: 'Integrations' },
]

export function ServerSettings() {
  const { showServerSettings, setShowServerSettings } = useUIStore()
  const { currentServer, updateGuild, deleteGuild } = useServerStore()
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [name, setName] = useState(currentServer?.name || '')
  const [hasChanges, setHasChanges] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!showServerSettings || !currentServer) return null

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
        setShowServerSettings(false)
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
    <div className={styles.overlay} onClick={() => setShowServerSettings(false)}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
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
            <h2>
              {TABS.find((t) => t.id === activeTab)?.icon}
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>
            <button className={styles.closeButton} onClick={() => setShowServerSettings(false)}>
              <X size={22} />
            </button>
          </div>

          <div className={styles.contentBody}>
            {/* ── Overview ── */}
            {activeTab === 'overview' && (
              <div className={styles.overviewSection}>
                <div className={styles.avatarRow}>
                  <div className={styles.avatarPreview}>
                    {uploadingIcon ? (
                      <div className={styles.uploadingSpinner} />
                    ) : (
                      <img
                        src={currentServer.icon || `https://api.dicebear.com/7.x/initials/svg?seed=${currentServer.name}`}
                        alt="Server Icon"
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
                      <span className={styles.infoValue}>{currentServer.memberCount ?? currentServer.members?.length ?? '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Roles ── */}
            {activeTab === 'roles' && (
              <div className={styles.emptyState}>
                <Shield size={48} className={styles.emptyIcon} />
                <h3>Role Management</h3>
                <p>Create and manage roles to control what members can do. Full role editor coming soon — for now, visit the server settings to manage roles via API.</p>
                <div className={styles.emptyHint}>
                  <code>POST /guilds/{currentServer.id}/roles</code>
                </div>
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
                      <div key={m.id} className={styles.memberRow}>
                        <img
                          src={m.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.id}`}
                          alt={m.user?.username}
                          className={styles.memberAvatar}
                        />
                        <div className={styles.memberInfo}>
                          <span className={styles.memberName}>{m.user?.username || m.userId}</span>
                          <span className={styles.memberRole}>{m.roles?.[0]?.name || 'Member'}</span>
                        </div>
                        {m.userId !== currentServer.ownerId && (
                          <div className={styles.memberActions}>
                            <button className={styles.memberBtn}>Kick</button>
                            <button className={`${styles.memberBtn} ${styles.memberBtnDanger}`}>Ban</button>
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
                <div className={styles.settingGroup}>
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
                <div className={styles.inviteCreate}>
                  <div className={styles.inviteInfo}>
                    <span>Permanent invite link</span>
                    <code className={styles.inviteCode}>beacon.app/invite/{currentServer.id.slice(0, 8)}</code>
                  </div>
                  <button
                    className={styles.copyBtn}
                    onClick={() => {
                      navigator.clipboard.writeText(`https://beacon.app/invite/${currentServer.id.slice(0, 8)}`)
                      toast.success('Invite link copied!')
                    }}
                  >
                    Copy Link
                  </button>
                </div>
                <div className={styles.emptyState} style={{ marginTop: 24 }}>
                  <Plus size={36} className={styles.emptyIcon} />
                  <h3>Invite management</h3>
                  <p>View and revoke all active invite links. Full invite manager coming soon.</p>
                </div>
              </div>
            )}

            {/* ── Bans ── */}
            {activeTab === 'bans' && (
              <div>
                <p className={styles.tabIntro}>
                  Users you've banned can't see or join your server.
                </p>
                <div className={styles.emptyState}>
                  <Lock size={40} className={styles.emptyIcon} />
                  <h3>No bans yet</h3>
                  <p>When you ban someone, they'll show up here. You can unban them any time.</p>
                </div>
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
                  <div className={styles.insightCard}>
                    <div className={styles.insightValue}>{currentServer.memberCount ?? currentServer.members?.length ?? 0}</div>
                    <div className={styles.insightLabel}>Total Members</div>
                  </div>
                  <div className={styles.insightCard}>
                    <div className={styles.insightValue}>{currentServer.channels?.length ?? 0}</div>
                    <div className={styles.insightLabel}>Channels</div>
                  </div>
                  <div className={styles.insightCard}>
                    <div className={styles.insightValue}>—</div>
                    <div className={styles.insightLabel}>Messages Today</div>
                  </div>
                  <div className={styles.insightCard}>
                    <div className={styles.insightValue}>—</div>
                    <div className={styles.insightLabel}>Active Now</div>
                  </div>
                </div>
                <div className={styles.emptyState} style={{ marginTop: 24 }}>
                  <BarChart2 size={40} className={styles.emptyIcon} />
                  <h3>Detailed analytics</h3>
                  <p>Full growth charts, message volume, and member activity coming soon.</p>
                </div>
              </div>
            )}
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
      </div>
    </div>
  )
}
