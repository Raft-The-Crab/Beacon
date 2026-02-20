import {
  Hash, Volume2, Settings, Plus, Rocket, Book, Smile,
  ChevronDown, ChevronRight, Bell, BellOff, Link, Trash2, Edit2,
  Megaphone, Mic, MessageSquare, ShieldAlert, GitBranch, Radio,
  Users, ChevronDown as ChevronDownSmall, FolderPlus, FolderOpen,
  Copy, Flag, Search, Star
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { useServerStore } from '../../stores/useServerStore'
import { useUIStore } from '../../stores/useUIStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { openCreateChannelModal } from '../../utils/modals'
import { isAndroid } from '../../utils/platform'
import { useContextMenuTrigger } from '../ui/ContextMenu'
import styles from './Sidebar.module.css'

// ── Channel type → icon mapping ──────────────────────────────────
function getChannelIcon(channel: any, size = 18) {
  const t = String(channel.type).toLowerCase()
  if (t === 'announcement' || channel.type === 5) return <Megaphone size={size} />
  if (t === 'stage' || channel.type === 13) return <Radio size={size} />
  if (t === 'forum' || channel.type === 15) return <MessageSquare size={size} />
  if (t === 'thread' || channel.type === 11 || channel.type === 12) return <GitBranch size={size} />
  if (t === 'voice' || channel.type === 2) return <Volume2 size={size} />
  if (t === 'group_dm' || channel.type === 3) return <Users size={size} />
  if (channel.nsfw) return <ShieldAlert size={size} />
  return <Hash size={size} />
}

function isVoiceLike(channel: any) {
  const t = String(channel.type).toLowerCase()
  return t === 'voice' || channel.type === 2 || t === 'stage' || channel.type === 13
}

// ── Channel button with right-click context menu ──────────────────
function ChannelButton({ channel, isActive, onClick, onCreateChannel }: {
  channel: any
  isActive: boolean
  onClick: () => void
  onCreateChannel?: () => void
}) {
  const [muted, setMuted] = useState(false)
  const ctxMenu = useContextMenuTrigger([
    {
      id: 'edit',
      label: 'Edit Channel',
      icon: <Edit2 size={15} />,
      onClick: () => {},
    },
    {
      id: 'copy',
      label: 'Copy Channel Link',
      icon: <Link size={15} />,
      onClick: () => navigator.clipboard.writeText(`beacon://channel/${channel.id}`),
    },
    {
      id: 'copy-id',
      label: 'Copy Channel ID',
      icon: <Copy size={15} />,
      onClick: () => navigator.clipboard.writeText(channel.id),
    },
    {
      id: 'mute',
      label: muted ? 'Unmute Channel' : 'Mute Channel',
      icon: muted ? <Bell size={15} /> : <BellOff size={15} />,
      onClick: () => setMuted(m => !m),
    },
    { id: 'd1', type: 'divider' as const },
    {
      id: 'create-channel',
      label: 'Create Channel',
      icon: <Plus size={15} />,
      onClick: () => onCreateChannel ? onCreateChannel() : openCreateChannelModal(),
    },
    {
      id: 'create-category',
      label: 'Create Category',
      icon: <FolderPlus size={15} />,
      onClick: () => openCreateChannelModal('category'),
    },
    { id: 'd2', type: 'divider' as const },
    {
      id: 'delete',
      label: 'Delete Channel',
      icon: <Trash2 size={15} />,
      onClick: () => {},
      danger: true,
    },
  ])

  return (
    <button
      {...ctxMenu}
      className={`${styles.channel} ${isActive ? styles.activeChannel : ''} ${muted ? styles.mutedChannel : ''}`}
      onClick={onClick}
    >
      <span className={styles.channelIcon}>
        {getChannelIcon(channel)}
      </span>
      <span className={styles.channelName}>{channel.name}</span>
      {muted && <BellOff size={13} className={styles.mutedIcon} />}
    </button>
  )
}

// ── Category header with right-click ─────────────────────────────
function CategoryHeader({ category, isCollapsed, onToggle, onCreateChannel }: {
  category: any
  isCollapsed: boolean
  onToggle: () => void
  onCreateChannel: () => void
}) {
  const ctxMenu = useContextMenuTrigger([
    {
      id: 'create-channel',
      label: 'Create Channel',
      icon: <Plus size={15} />,
      onClick: () => openCreateChannelModal(),
    },
    {
      id: 'create-category',
      label: 'Create Category',
      icon: <FolderPlus size={15} />,
      onClick: () => openCreateChannelModal('category'),
    },
    { id: 'd1', type: 'divider' as const },
    {
      id: 'edit',
      label: 'Edit Category',
      icon: <Edit2 size={15} />,
      onClick: () => {},
    },
    {
      id: 'copy-id',
      label: 'Copy Category ID',
      icon: <Copy size={15} />,
      onClick: () => category?.id && navigator.clipboard.writeText(category.id),
    },
    { id: 'd2', type: 'divider' as const },
    {
      id: 'delete',
      label: 'Delete Category',
      icon: <Trash2 size={15} />,
      onClick: () => {},
      danger: true,
    },
  ])

  return (
    <div
      {...ctxMenu}
      className={styles.categoryHeader}
      onClick={onToggle}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.categoryLeft}>
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        <span>{(category?.name || 'CHANNELS').toUpperCase()}</span>
      </div>
      <button
        className={styles.addChannelBtn}
        onClick={(e) => { e.stopPropagation(); onCreateChannel() }}
        title="Create Channel"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

// ── Uncategorized section header with right-click ─────────────────
function UncategorizedHeader({ label, isCollapsed, onToggle, catKey }: {
  label: string
  isCollapsed: boolean
  onToggle: () => void
  catKey: string
}) {
  const ctxMenu = useContextMenuTrigger([
    {
      id: 'create-channel',
      label: 'Create Channel',
      icon: <Plus size={15} />,
      onClick: () => openCreateChannelModal(),
    },
    {
      id: 'create-category',
      label: 'Create Category',
      icon: <FolderPlus size={15} />,
      onClick: () => openCreateChannelModal('category'),
    },
  ])

  return (
    <div
      {...ctxMenu}
      className={styles.categoryHeader}
      onClick={onToggle}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.categoryLeft}>
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        <span>{label}</span>
      </div>
      <button
        className={styles.addChannelBtn}
        onClick={(e) => { e.stopPropagation(); openCreateChannelModal() }}
        title="Create Channel"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

// ── Main Sidebar ──────────────────────────────────────────────────
export function Sidebar() {
  const navigate = useNavigate()
  const currentServer = useServerStore(state => state.currentServer)
  const currentChannelId = useUIStore(state => state.currentChannelId)
  const setShowServerSettings = useUIStore(state => state.setShowServerSettings)
  const setShowUserSettings = useUIStore(state => state.setShowUserSettings)
  const setShowCustomStatus = useUIStore(state => state.setShowCustomStatus)
  const user = useAuthStore(state => state.user)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [showServerMenu, setShowServerMenu] = useState(false)

  const allChannels = currentServer?.channels || []
  const categories = allChannels.filter((ch: any) => {
    const type = String(ch.type).toLowerCase()
    return ch.type === 4 || type === 'category'
  })
  const channelsWithoutParent = allChannels.filter((ch: any) => {
    const type = String(ch.type).toLowerCase()
    return !ch.parentId && ch.type !== 4 && type !== 'category'
  })
  const getChannelsInCategory = (categoryId: string) =>
    allChannels.filter((ch: any) => ch.parentId === categoryId)

  const textLike = channelsWithoutParent.filter((ch: any) => !isVoiceLike(ch))
  const voiceLike = channelsWithoutParent.filter((ch: any) => isVoiceLike(ch))

  const toggleCategory = useCallback((catId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }, [])

  const handleChannelClick = useCallback((channelId: string) => {
    if (currentServer) navigate(`/channels/${currentServer.id}/${channelId}`)
  }, [currentServer, navigate])

  // Right-click on server name → server context menu
  const serverCtxMenu = useContextMenuTrigger([
    { id: 'settings', label: 'Server Settings', icon: <Settings size={15} />, onClick: () => setShowServerSettings(true) },
    { id: 'create-channel', label: 'Create Channel', icon: <Plus size={15} />, onClick: () => openCreateChannelModal() },
    { id: 'create-category', label: 'Create Category', icon: <FolderPlus size={15} />, onClick: () => openCreateChannelModal('category') },
    { id: 'd1', type: 'divider' as const },
    { id: 'copy-id', label: 'Copy Server ID', icon: <Copy size={15} />, onClick: () => currentServer && navigator.clipboard.writeText(currentServer.id) },
    { id: 'invite', label: 'Invite People', icon: <Link size={15} />, onClick: () => currentServer && navigator.clipboard.writeText(`https://beacon.app/invite/${currentServer.id}`) },
  ])

  const userAvatar = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'default'}`
  const username = user?.username || 'User'
  const discriminator = user?.discriminator || '0000'
  const memberCount = currentServer?.members?.length || 0

  return (
    <div className={styles.sidebar}>
      {/* ── Server header ── */}
      <div
        {...serverCtxMenu}
        className={styles.header}
        style={currentServer?.banner ? {
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), var(--bg-secondary)), url(${currentServer.banner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {}}
        onClick={() => setShowServerMenu(s => !s)}
      >
        <div className={styles.headerContent}>
          <h1 className={styles.guildName}>{currentServer?.name || 'Beacon'}</h1>
          {memberCount > 0 && (
            <span className={styles.memberCount}>
              <span className={styles.onlineDot} />
              {memberCount} member{memberCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {currentServer && (
          <ChevronDownSmall
            size={18}
            className={`${styles.chevron} ${showServerMenu ? styles.chevronOpen : ''}`}
          />
        )}
      </div>

      {/* Server actions dropdown */}
      {showServerMenu && currentServer && (
        <div className={styles.serverMenu}>
          <button className={styles.serverMenuItem} onClick={() => { setShowServerSettings(true); setShowServerMenu(false) }}>
            <Settings size={15} /> Server Settings
          </button>
          <button className={styles.serverMenuItem} onClick={() => { openCreateChannelModal(); setShowServerMenu(false) }}>
            <Plus size={15} /> Create Channel
          </button>
          <button className={styles.serverMenuItem} onClick={() => { openCreateChannelModal('category'); setShowServerMenu(false) }}>
            <FolderPlus size={15} /> Create Category
          </button>
          <div className={styles.serverMenuDivider} />
          <button className={styles.serverMenuItem} onClick={() => { navigator.clipboard.writeText(`https://beacon.app/invite/${currentServer.id}`); setShowServerMenu(false) }}>
            <Link size={15} /> Invite People
          </button>
          <button className={styles.serverMenuItem} onClick={() => { navigator.clipboard.writeText(currentServer.id); setShowServerMenu(false) }}>
            <Copy size={15} /> Copy Server ID
          </button>
        </div>
      )}

      {/* ── Channel list ── */}
      <div className={styles.channels}>
        {!currentServer ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyText}>Select a server to view channels</span>
          </div>
        ) : (
          <>
            {/* Categories with children */}
            {categories.map((category: any) => {
              const catChannels = getChannelsInCategory(category.id)
              const isCollapsed = collapsedCategories.has(category.id)
              return (
                <div key={category.id} className={styles.category}>
                  <CategoryHeader
                    category={category}
                    isCollapsed={isCollapsed}
                    onToggle={() => toggleCategory(category.id)}
                    onCreateChannel={() => openCreateChannelModal(undefined, category.id)}
                  />
                  {!isCollapsed && (
                    <div className={styles.channelList}>
                      {catChannels.map((channel: any) => (
                        <ChannelButton
                          key={channel.id}
                          channel={channel}
                          isActive={currentChannelId === channel.id}
                          onClick={() => handleChannelClick(channel.id)}
                          onCreateChannel={() => openCreateChannelModal(undefined, category.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Text-like channels without categories */}
            {textLike.length > 0 && (
              <div className={styles.category}>
                <UncategorizedHeader
                  label="TEXT CHANNELS"
                  isCollapsed={collapsedCategories.has('__text__')}
                  onToggle={() => toggleCategory('__text__')}
                  catKey="__text__"
                />
                {!collapsedCategories.has('__text__') && (
                  <div className={styles.channelList}>
                    {textLike.map((channel: any) => (
                      <ChannelButton
                        key={channel.id}
                        channel={channel}
                        isActive={currentChannelId === channel.id}
                        onClick={() => handleChannelClick(channel.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Voice-like channels without categories */}
            {voiceLike.length > 0 && (
              <div className={styles.category}>
                <UncategorizedHeader
                  label="VOICE CHANNELS"
                  isCollapsed={collapsedCategories.has('__voice__')}
                  onToggle={() => toggleCategory('__voice__')}
                  catKey="__voice__"
                />
                {!collapsedCategories.has('__voice__') && (
                  <div className={styles.channelList}>
                    {voiceLike.map((channel: any) => (
                      <ChannelButton
                        key={channel.id}
                        channel={channel}
                        isActive={currentChannelId === channel.id}
                        onClick={() => handleChannelClick(channel.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!isAndroid() && (
          <div className={styles.category}>
            <div className={styles.categoryHeader}>
              <span>DEVELOPER</span>
            </div>
            <div className={styles.channelList}>
              <button className={styles.channel} onClick={() => navigate('/developer')}>
                <span className={styles.channelIcon}><Rocket size={18} /></span>
                <span className={styles.channelName}>Developer Portal</span>
              </button>
              <button className={styles.channel} onClick={() => navigate('/docs')}>
                <span className={styles.channelIcon}><Book size={18} /></span>
                <span className={styles.channelName}>Documentation</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── User area ── */}
      <div className={styles.userArea}>
        <div className={styles.userPanel}>
          <div className={styles.avatar}>
            <img src={userAvatar} alt={username} />
            <div className={`${styles.statusIndicator} ${styles[user?.status || 'online']}`} />
          </div>
          <div className={styles.userInfo}>
            <span className={styles.username}>{username}</span>
            {(user as any)?.customStatus ? (
              <span className={styles.customStatusText} title={(user as any).customStatus}>
                {(user as any).customStatus}
              </span>
            ) : (
              <span className={styles.discriminator}>#{discriminator}</span>
            )}
          </div>
        </div>
        <div className={styles.userControls}>
          <button
            className={styles.controlButton}
            onClick={() => setShowCustomStatus(true)}
            title="Set Custom Status"
          >
            <Smile size={18} />
          </button>
          <button className={styles.controlButton} onClick={() => setShowUserSettings(true)} title="User Settings">
            <Settings size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
