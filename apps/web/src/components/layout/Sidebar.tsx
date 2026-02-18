import { Hash, Volume2, Settings, Plus, Rocket, Book, Smile, ChevronDown, ChevronRight, Bell, BellOff, Link, Trash2, Edit2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useServerStore } from '../../stores/useServerStore'
import { useUIStore } from '../../stores/useUIStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { openCreateChannelModal } from '../../utils/modals'
import { isAndroid } from '../../utils/platform'
import { useContextMenuTrigger } from '../ui/ContextMenu'
import styles from './Sidebar.module.css'

// Channel button with context menu
function ChannelButton({ channel, isActive, onClick, type }: {
  channel: any
  isActive: boolean
  onClick: () => void
  type: 'text' | 'voice'
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
      {type === 'text' ? (
        <Hash size={18} className={styles.channelIcon} />
      ) : (
        <Volume2 size={18} className={styles.channelIcon} />
      )}
      <span className={styles.channelName}>{channel.name}</span>
      {muted && <BellOff size={13} className={styles.mutedIcon} />}
    </button>
  )
}

export function Sidebar() {
  const navigate = useNavigate()
  const currentServer = useServerStore(state => state.currentServer);
  const currentChannelId = useUIStore(state => state.currentChannelId);
  const setShowServerSettings = useUIStore(state => state.setShowServerSettings);
  const setShowUserSettings = useUIStore(state => state.setShowUserSettings);
  const setShowCustomStatus = useUIStore(state => state.setShowCustomStatus);
  const user = useAuthStore(state => state.user);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Group channels by categories
  const allChannels = currentServer?.channels || [];

  // Separate categories and regular channels (case-insensitive)
  const categories = allChannels.filter((ch: any) => {
    const type = String(ch.type).toLowerCase();
    return ch.type === 4 || type === 'category';
  });
  
  const channelsWithoutParent = allChannels.filter((ch: any) => {
    const type = String(ch.type).toLowerCase();
    return !ch.parentId && ch.type !== 4 && type !== 'category';
  });
  
  // Function to get channels under a category
  const getChannelsInCategory = (categoryId: string) => {
    return allChannels.filter((ch: any) => ch.parentId === categoryId);
  };
  
  // Separate text and voice channels (for channels without categories)
  const textChannels = channelsWithoutParent.filter((channel: any) => {
    const t = String(channel.type).toLowerCase();
    return channel.type === 0 || t === 'text';
  });
  
  const voiceChannels = channelsWithoutParent.filter((channel: any) => {
    const t = String(channel.type).toLowerCase();
    return channel.type === 1 || t === 'voice';
  });

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const handleChannelClick = (channelId: string) => {
    if (currentServer) {
      navigate(`/channels/${currentServer.id}/${channelId}`)
    }
  }

  const userAvatar = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'default'}`
  const username = user?.username || 'User'
  const discriminator = user?.discriminator || '0000'

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h1 className={styles.guildName}>{currentServer?.name || 'Beacon'}</h1>
        {currentServer && (
          <button
            className={styles.settingsBtn}
            onClick={() => setShowServerSettings(true)}
            title="Server Settings"
          >
            <Settings size={18} />
          </button>
        )}
      </div>

      <div className={styles.channels}>
        {!currentServer ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyText}>Select a server to view channels</span>
          </div>
        ) : (
          <>
            {/* Render categories with their children */}
            {categories.map((category: any) => {
              const categoryChannels = getChannelsInCategory(category.id);
              const categoryTextChannels = categoryChannels.filter((ch: any) => {
                const t = ch.type as any;
                return t === 0 || t === 'text' || t === 'TEXT';
              });
              const categoryVoiceChannels = categoryChannels.filter((ch: any) => {
                const t = ch.type as any;
                return t === 1 || t === 'voice' || t === 'VOICE';
              });
              const isCollapsed = collapsedCategories.has(category.id);
              
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
                      {categoryTextChannels.map((channel: any) => (
                        <ChannelButton key={channel.id} channel={channel} isActive={currentChannelId === channel.id} onClick={() => handleChannelClick(channel.id)} type="text" />
                      ))}
                      {categoryVoiceChannels.map((channel: any) => (
                        <ChannelButton key={channel.id} channel={channel} isActive={currentChannelId === channel.id} onClick={() => handleChannelClick(channel.id)} type="voice" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Channels without categories */}
            {textChannels.length > 0 && (
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
                  <button
                    className={styles.addChannelBtn}
                    onClick={(e) => { e.stopPropagation(); openCreateChannelModal() }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {!collapsedCategories.has('__text__') && (
                  <div className={styles.channelList}>
                    {textChannels.map((channel: any) => (
                      <ChannelButton key={channel.id} channel={channel} isActive={currentChannelId === channel.id} onClick={() => handleChannelClick(channel.id)} type="text" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {voiceChannels.length > 0 && (
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
                  <button
                    className={styles.addChannelBtn}
                    onClick={(e) => { e.stopPropagation(); openCreateChannelModal() }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {!collapsedCategories.has('__voice__') && (
                  <div className={styles.channelList}>
                    {voiceChannels.map((channel: any) => (
                      <ChannelButton key={channel.id} channel={channel} isActive={currentChannelId === channel.id} onClick={() => handleChannelClick(channel.id)} type="voice" />
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
                <Rocket size={18} className={styles.channelIcon} />
                <span className={styles.channelName}>Developer Portal</span>
              </button>
              <button className={styles.channel} onClick={() => navigate('/docs')}>
                <Book size={18} className={styles.channelIcon} />
                <span className={styles.channelName}>Documentation</span>
              </button>
            </div>
          </div>
        )}
      </div>

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
