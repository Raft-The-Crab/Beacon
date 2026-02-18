import { Hash, Volume2, Settings, Plus, Rocket, Book, Smile } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useServerStore } from '../../stores/useServerStore'
import { useUIStore } from '../../stores/useUIStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { openCreateChannelModal } from '../../utils/modals'
import { isAndroid } from '../../utils/platform'
import styles from './Sidebar.module.css'

export function Sidebar() {
  const navigate = useNavigate()
  const currentServer = useServerStore(state => state.currentServer);
  const currentChannelId = useUIStore(state => state.currentChannelId);
  const setShowServerSettings = useUIStore(state => state.setShowServerSettings);
  const setShowUserSettings = useUIStore(state => state.setShowUserSettings);
  const setShowCustomStatus = useUIStore(state => state.setShowCustomStatus);
  const user = useAuthStore(state => state.user);

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
              
              return (
                <div key={category.id} className={styles.category}>
                  <div className={styles.categoryHeader}>
                    <span>{category.name.toUpperCase()}</span>
                    <button
                      className={styles.addChannelBtn}
                      onClick={() => openCreateChannelModal()}
                      title="Create Channel"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className={styles.channelList}>
                    {categoryTextChannels.map((channel: any) => (
                      <button
                        key={channel.id}
                        className={`${styles.channel} ${currentChannelId === channel.id ? styles.activeChannel : ''}`}
                        onClick={() => handleChannelClick(channel.id)}
                      >
                        <Hash size={18} className={styles.channelIcon} />
                        <span className={styles.channelName}>{channel.name}</span>
                      </button>
                    ))}
                    {categoryVoiceChannels.map((channel: any) => (
                      <button
                        key={channel.id}
                        className={`${styles.channel} ${currentChannelId === channel.id ? styles.activeChannel : ''}`}
                        onClick={() => handleChannelClick(channel.id)}
                      >
                        <Volume2 size={18} className={styles.channelIcon} />
                        <span className={styles.channelName}>{channel.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {/* Channels without categories */}
            {textChannels.length > 0 && (
              <div className={styles.category}>
                <div className={styles.categoryHeader}>
                  <span>TEXT CHANNELS</span>
                  <button
                    className={styles.addChannelBtn}
                    onClick={() => openCreateChannelModal()}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className={styles.channelList}>
                  {textChannels.map((channel: any) => (
                    <button
                      key={channel.id}
                      className={`${styles.channel} ${currentChannelId === channel.id ? styles.activeChannel : ''}`}
                      onClick={() => handleChannelClick(channel.id)}
                    >
                      <Hash size={18} className={styles.channelIcon} />
                      <span className={styles.channelName}>{channel.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {voiceChannels.length > 0 && (
              <div className={styles.category}>
                <div className={styles.categoryHeader}>
                  <span>VOICE CHANNELS</span>
                  <button
                    className={styles.addChannelBtn}
                    onClick={() => openCreateChannelModal()}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className={styles.channelList}>
                  {voiceChannels.map((channel: any) => (
                    <button
                      key={channel.id}
                      className={`${styles.channel} ${currentChannelId === channel.id ? styles.activeChannel : ''}`}
                      onClick={() => handleChannelClick(channel.id)}
                    >
                      <Volume2 size={18} className={styles.channelIcon} />
                      <span className={styles.channelName}>{channel.name}</span>
                    </button>
                  ))}
                </div>
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
