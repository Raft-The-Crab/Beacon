import {
  Hash, Volume2, Settings, Plus, Rocket, Book, Smile,
  ChevronDown, ChevronRight, Bell, BellOff, Link, Trash2, Edit2,
  Megaphone, Mic, MessageSquare, ShieldAlert, GitBranch, Radio,
  Users, ChevronDown as ChevronDownSmall
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
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
  // Default: text (#)
  return <Hash size={size} />
}

function isVoiceLike(channel: any) {
  const t = String(channel.type).toLowerCase()
  return t === 'voice' || channel.type === 2 || t === 'stage' || channel.type === 13
}

// ── Channel button with context menu ──────────────────────────────
function ChannelButton({ channel, isActive, onClick }: {
  channel: any
  isActive: boolean
  onClick: () => void
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
      id: 'mute',
      label: muted ? 'Unmute Channel' : 'Mute Channel',
      icon: muted ? <Bell size={15} /> : <BellOff size={15} />,
      onClick: () => setMuted(m => !m),
    },
    { id: 'd1', type: 'divider' as const },
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

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const handleChannelClick = (channelId: string) => {
    if (currentServer) navigate(`/channels/${currentServer.id}/${channelId}`)
  }

  const userAvatar = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'default'}`
  const username = user?.username || 'User'
  const discriminator = user?.discriminator || '0000'
  const memberCount = currentServer?.members?.length || 0

  return (
    <div className={styles.sidebar}>
      {/* ── Server banner/header ── */}
      <div
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

      {/* Quick server actions dropdown */}
      {showServerMenu && currentServer && (
        <div className={styles.serverMenu}>
          <button className={styles.serverMenuItem} onClick={() => { setShowServerSettings(true); setShowServerMenu(false) }}>
            <Settings size={15} /> Server Settings
          </button>
          <button className={styles.serverMenuItem} onClick={() => { openCreateChannelModal(); setShowServerMenu(false) }}>
            <Plus size={15} /> Create Channel
          </button>
          <div className={styles.serverMenuDivider} />
          <button className={styles.serverMenuItem} onClick={() => { navigator.clipboard.writeText(currentServer.id); setShowServerMenu(false) }}>
            <Link size={15} /> Copy Server ID
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
                  <div
                    className={styles.categoryHeader}
                    onClick={() => toggleCategory(category.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.categoryLeft}>
                      {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                      <span>{category.name.toUpperCase()}</span>
                    </div>
                    <button
                      className={styles.addChannelBtn}
                      onClick={(e) => { e.stopPropagation(); openCreateChannelModal() }}
                      title="Create Channel"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {!isCollapsed && (
                    <div className={styles.channelList}>
                      {catChannels.map((channel: any) => (
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
              )
            })}

            {/* Text-like channels without categories */}
            {textLike.length > 0 && (
              <div className={styles.category}>
                <div
                  className={styles.categoryHeader}
                  onClick={() => toggleCategory('__text__')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.categoryLeft}>
                    {collapsedCategories.has('__text__') ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    <span>TEXT CHANNELS</span>
                  </div>
                  <button className={styles.addChannelBtn} onClick={(e) => { e.stopPropagation(); openCreateChannelModal() }}>
                    <Plus size={14} />
                  </button>
                </div>
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
                <div
                  className={styles.categoryHeader}
                  onClick={() => toggleCategory('__voice__')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.categoryLeft}>
                    {collapsedCategories.has('__voice__') ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    <span>VOICE CHANNELS</span>
                  </div>
                  <button className={styles.addChannelBtn} onClick={(e) => { e.stopPropagation(); openCreateChannelModal() }}>
                    <Plus size={14} />
                  </button>
                </div>
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
