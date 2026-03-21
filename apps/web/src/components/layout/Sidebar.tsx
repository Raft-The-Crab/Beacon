import {
  Hash, Volume2, Plus,
  ChevronDown, ChevronRight, Bell, BellOff, Link, Trash2, Edit2,
  Megaphone, MessageSquare, ShieldAlert, GitBranch, Radio,
  Users, FolderPlus,
  Copy, Settings, LogOut, ChevronDown as ChevronDownSmall, Crown
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback } from 'react'
import { useServerStore } from '../../stores/useServerStore'
import { useUIStore } from '../../stores/useUIStore'
import { useToast, SkeletonChannel } from '../ui'
import { CurrentUserControls } from '../features/CurrentUserControls'
import { openCreateChannelModal } from '../../utils/modals'

import { useContextMenuTrigger } from '../ui/ContextMenu'
import styles from '../../styles/modules/layout/Sidebar.module.css'

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
function ChannelButton({ channel, isActive, onClick, onCreateChannel, onDeleteChannel }: {
  channel: any
  isActive: boolean
  onClick: () => void
  onCreateChannel?: () => void
  onDeleteChannel?: (channel: any) => void
}) {
  const [muted, setMuted] = useState(false)
  const ctxMenu = useContextMenuTrigger([
    {
      id: 'edit',
      label: 'Edit Channel',
      icon: <Edit2 size={15} />,
      onClick: () => { },
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
    { id: 'd1', divider: true, label: '' },
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
    { id: 'd2', divider: true, label: '' },
    {
      id: 'delete',
      label: 'Delete Channel',
      icon: <Trash2 size={15} />,
      onClick: () => onDeleteChannel?.(channel),
      danger: true,
    },
  ])

  // Real unread logic can be integrated later
  const unreadCount = 0
  const hasMention = unreadCount > 0 && channel.id.charCodeAt(0) % 3 === 0

  return (
    <button
      onContextMenu={ctxMenu}
      className={`${styles.channel} ${isActive ? styles.activeChannel : ''} ${muted ? styles.mutedChannel : ''} ${unreadCount > 0 && !isActive ? styles.unreadChannel : ''}`}
      onClick={onClick}
    >
      {unreadCount > 0 && !isActive && <span className={styles.unreadDot} />}
      <span className={styles.channelIcon}>
        {getChannelIcon(channel)}
      </span>
      <span className={styles.channelName}>{channel.name}</span>
      {muted && <BellOff size={13} className={styles.mutedIcon} />}
      {hasMention && !muted && <span className={styles.mentionBadge}>{unreadCount}</span>}
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
      onClick: () => onCreateChannel(),
    },
    {
      id: 'create-category',
      label: 'Create Category',
      icon: <FolderPlus size={15} />,
      onClick: () => openCreateChannelModal('category'),
    },
    { id: 'd1', divider: true, label: '' },
    {
      id: 'edit',
      label: 'Edit Category',
      icon: <Edit2 size={15} />,
      onClick: () => { },
    },
    {
      id: 'copy-id',
      label: 'Copy Category ID',
      icon: <Copy size={15} />,
      onClick: () => category?.id && navigator.clipboard.writeText(category.id),
    },
    { id: 'd2', divider: true, label: '' },
    {
      id: 'delete',
      label: 'Delete Category',
      icon: <Trash2 size={15} />,
      onClick: () => { },
      danger: true,
    },
  ])

  return (
    <div
      onContextMenu={ctxMenu}
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
function UncategorizedHeader({ label, isCollapsed, onToggle }: {
  label: string
  isCollapsed: boolean
  onToggle: () => void
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
      onContextMenu={ctxMenu}
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
        aria-label="Create new channel"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

// ── Uncategorized section component ──
function CategorySection({ label, channels, currentChannelId, handleChannelClick, isCollapsed, onToggle, onDeleteChannel }: any) {
  return (
    <div className={styles.category}>
      <UncategorizedHeader
        label={label}
        isCollapsed={isCollapsed}
        onToggle={onToggle}
      />
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={styles.channelList}
          >
            {channels.map((channel: any) => (
              <ChannelButton
                key={channel.id}
                channel={channel}
                isActive={currentChannelId === channel.id}
                onClick={() => handleChannelClick(channel.id)}
                onDeleteChannel={onDeleteChannel}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Sidebar ──────────────────────────────────────────────────
export function Sidebar() {
  const navigate = useNavigate()
  const currentServer = useServerStore(state => state.currentServer)
  const currentChannelId = useUIStore(state => state.currentChannelId)
  const setShowServerSettings = useUIStore(state => state.setShowServerSettings)
  const leaveGuild = useServerStore(state => state.leaveGuild)
  const deleteChannel = useServerStore(state => state.deleteChannel)
  const { show } = useToast()
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [showServerMenu, setShowServerMenu] = useState(false)

  const allChannels = currentServer?.channels || []
  const categories = allChannels.filter((ch: any) => {
    const type = String(ch.type).toUpperCase()
    return ch.type === 4 || type === 'CATEGORY'
  })
  const channelsWithoutParent = allChannels.filter((ch: any) => {
    const type = String(ch.type).toUpperCase()
    return !ch.parentId && ch.type !== 4 && type !== 'CATEGORY'
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

  const handleDeleteChannel = useCallback(async (channel: any) => {
    if (!currentServer?.id || !channel?.id) return
    const ok = confirm(`Delete channel "${channel.name || 'Unnamed'}"? This cannot be undone.`)
    if (!ok) return

    try {
      await deleteChannel(currentServer.id, channel.id)
      if (currentChannelId === channel.id) {
        navigate(`/channels/${currentServer.id}`)
      }
      show('Channel deleted', 'success')
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Unable to delete channel'
      show(message, 'error')
    }
  }, [currentServer, currentChannelId, deleteChannel, navigate, show])

  const handleChannelClick = useCallback((channelId: string) => {
    if (!currentServer) return
    const channel = allChannels.find((ch: any) => ch.id === channelId)
    if (channel && isVoiceLike(channel)) {
      navigate(`/voice?guildId=${currentServer.id}&channelId=${channel.id}&name=${encodeURIComponent(channel.name || 'Voice Channel')}`)
      return
    }
    navigate(`/channels/${currentServer.id}/${channelId}`)
  }, [allChannels, currentServer, navigate])

  const serverCtxMenu = useContextMenuTrigger([
    { id: 'settings', label: 'Server Settings', icon: <Settings size={15} />, onClick: () => setShowServerSettings(true) },
    { id: 'boost', label: 'Server Boost', icon: <Crown size={15} color="#f0b232" />, onClick: () => window.dispatchEvent(new CustomEvent('open-server-boost')) },
    { id: 'create-channel', label: 'Create Channel', icon: <Plus size={15} />, onClick: () => openCreateChannelModal() },
    { id: 'create-category', label: 'Create Category', icon: <FolderPlus size={15} />, onClick: () => openCreateChannelModal('category') },
    { id: 'd1', divider: true, label: '' },
    { id: 'copy-id', label: 'Copy Server ID', icon: <Copy size={15} />, onClick: () => currentServer && navigator.clipboard.writeText(currentServer.id) },
    { id: 'invite', label: 'Invite People', icon: <Link size={15} />, onClick: () => window.dispatchEvent(new CustomEvent('open-server-invite')) },
  ])

  const memberCount = currentServer?.members?.length || 0

  return (
    <div className={`${styles.sidebar} glass`}>
      <div
        onContextMenu={serverCtxMenu}
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

      <AnimatePresence>
        {showServerMenu && currentServer && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={styles.serverMenu}
          >
            <button className={styles.serverMenuItem} onClick={() => { setShowServerSettings(true); setShowServerMenu(false) }}>
              <Settings size={15} /> Server Settings
            </button>
            <button className={styles.serverMenuItem} onClick={() => { window.dispatchEvent(new CustomEvent('open-server-boost')); setShowServerMenu(false) }}>
              <Crown size={15} color="#f0b232" /> Server Boost
            </button>
            <button className={styles.serverMenuItem} onClick={() => { openCreateChannelModal(); setShowServerMenu(false) }}>
              <Plus size={15} /> Create Channel
            </button>
            <button className={styles.serverMenuItem} onClick={() => { openCreateChannelModal('category'); setShowServerMenu(false) }}>
              <FolderPlus size={15} /> Create Category
            </button>
            <div className={styles.serverMenuDivider} />
            <button className={styles.serverMenuItem} onClick={() => { window.dispatchEvent(new CustomEvent('open-server-invite')); setShowServerMenu(false) }}>
              <Link size={15} /> Invite People
            </button>
            <button className={styles.serverMenuItem} onClick={() => { navigator.clipboard.writeText(currentServer.id); setShowServerMenu(false) }}>
              <Copy size={15} /> Copy Server ID
            </button>
            <div className={styles.serverMenuDivider} />
            <button
              className={`${styles.serverMenuItem} ${styles.danger}`}
              onClick={async () => {
                try {
                  await leaveGuild(currentServer.id)
                  setShowServerMenu(false)
                  navigate('/channels/@me')
                  show('You left the server', 'success')
                } catch (err: any) {
                  const message = err?.response?.data?.error || 'Unable to leave this server'
                  show(message, 'error')
                }
              }}
            >
              <LogOut size={15} /> Leave Server
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.channels} onContextMenu={serverCtxMenu}>
        {!currentServer ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyText}>Select a server to view channels</span>
          </div>
        ) : allChannels.length === 0 ? (
          <div className={styles.skeletonContainer}>
            <div className={styles.categorySkeleton}>
              <SkeletonChannel />
              <SkeletonChannel />
              <SkeletonChannel />
            </div>
            <div className={styles.categorySkeleton}>
              <SkeletonChannel />
              <SkeletonChannel />
            </div>
          </div>
        ) : (
          <>
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
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className={styles.channelList}
                      >
                        {catChannels.map((channel: any) => (
                          <ChannelButton
                            key={channel.id}
                            channel={channel}
                            isActive={currentChannelId === channel.id}
                            onClick={() => handleChannelClick(channel.id)}
                            onCreateChannel={() => openCreateChannelModal(undefined, category.id)}
                            onDeleteChannel={handleDeleteChannel}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}

            {textLike.length > 0 && (
              <CategorySection
                label="TEXT CHANNELS"
                channels={textLike}
                currentChannelId={currentChannelId}
                handleChannelClick={handleChannelClick}
                isCollapsed={collapsedCategories.has('__text__')}
                onToggle={() => toggleCategory('__text__')}
                onDeleteChannel={handleDeleteChannel}
              />
            )}

            {voiceLike.length > 0 && (
              <CategorySection
                label="VOICE CHANNELS"
                channels={voiceLike}
                currentChannelId={currentChannelId}
                handleChannelClick={handleChannelClick}
                isCollapsed={collapsedCategories.has('__voice__')}
                onToggle={() => toggleCategory('__voice__')}
                onDeleteChannel={handleDeleteChannel}
              />
            )}
          </>
        )}
      </div>

      <CurrentUserControls />
    </div>
  )
}
