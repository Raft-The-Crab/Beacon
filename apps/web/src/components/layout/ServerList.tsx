import { Home, Plus, Compass, Folder, Settings, UserPlus, LogOut, Bell, Copy, Hash, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useServerStore } from '../../stores/useServerStore'
import { useUIStore } from '../../stores/useUIStore'
import { openCreateServerModal, openCreateChannelModal } from '../../utils/modals'
import { useContextMenuTrigger } from '../ui/ContextMenu'
import { Tooltip, useToast } from '../ui'
import styles from './ServerList.module.css'

// ── Individual server button with its own context menu ──────
function ServerButton({ server, isActive, onClick }: {
  server: any
  isActive: boolean
  onClick: () => void
}) {
  const { show } = useToast()
  const setShowServerSettings = useUIStore(s => s.setShowServerSettings)

  const onContextMenu = useContextMenuTrigger([
    {
      id: 'mark-read',
      label: 'Mark as Read',
      icon: <Hash size={16} />,
      onClick: () => show('Marked as read', 'success'),
      divider: true,
    },
    {
      id: 'boost',
      label: 'Server Boost',
      icon: <Zap size={16} />,
      onClick: () => {
        onClick()
        // We'll handle this in MessagingHome using a custom event or store
        window.dispatchEvent(new CustomEvent('open-server-boost'))
      },
    },
    {
      id: 'invite',
      label: 'Invite People',
      icon: <UserPlus size={16} />,
      onClick: () => {
        onClick()
        window.dispatchEvent(new CustomEvent('open-server-invite'))
      },
    },
    {
      id: 'create-channel',
      label: 'Create Channel',
      icon: <Hash size={16} />,
      onClick: () => {
        onClick()
        openCreateChannelModal('TEXT')
      },
    },
    {
      id: 'create-category',
      label: 'Create Category',
      icon: <Folder size={16} />,
      divider: true,
      onClick: () => {
        onClick()
        openCreateChannelModal('CATEGORY')
      },
    },
    {
      id: 'notifs',
      label: 'Notification Settings',
      icon: <Bell size={16} />,
      onClick: () => show('Notification settings (coming soon)', 'info'),
    },
    {
      id: 'copy-id',
      label: 'Copy Server ID',
      icon: <Copy size={16} />,
      shortcut: '⌘C',
      onClick: () => {
        navigator.clipboard.writeText(server.id)
        show('Server ID copied!', 'success')
      },
    },
    {
      id: 'settings',
      label: 'Server Settings',
      icon: <Settings size={16} />,
      divider: true,
      onClick: () => {
        onClick()
        setShowServerSettings(true)
      },
    },
    {
      id: 'leave',
      label: 'Leave Server',
      icon: <LogOut size={16} />,
      danger: true,
      onClick: () => show('Leave server (coming soon)', 'info'),
    },
  ])

  return (
    <Tooltip content={server.name} position="right">
      <button
        className={`${styles.serverButton} ${isActive ? styles.activeServer : ''}`}
        onClick={onClick}
        onContextMenu={onContextMenu}
      >
        <div className={styles.serverIcon}>
          {server.icon ? (
            <img src={server.icon} alt={server.name} className={styles.serverIconImg} />
          ) : (
            <span>{server.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        {/* Active indicator pill */}
        <div className={styles.activePill} />
      </button>
    </Tooltip>
  )
}

// ── Main ServerList ──────────────────────────────────────────
export function ServerList() {
  const navigate = useNavigate()
  const { show } = useToast()
  const servers = useServerStore(state => state.servers)
  const folders = useServerStore(state => state.folders)
  const currentServerId = useServerStore(state => state.currentServerId)
  const setCurrentServer = useServerStore(state => state.setCurrentServer)
  const toggleFolder = useServerStore(state => state.toggleFolder)

  const serversInFolders = new Set(folders.flatMap(f => f.serverIds))
  const standaloneServers = servers.filter(s => !serversInFolders.has(s.id))

  const handleServerClick = (server: any) => {
    setCurrentServer(server.id)
    if (server.channels && server.channels.length > 0) {
      navigate(`/channels/${server.id}/${server.channels[0].id}`)
    } else {
      navigate(`/server/${server.id}/settings`)
    }
  }

  const addMenuTrigger = useContextMenuTrigger([
    {
      id: 'create',
      label: 'Create a Server',
      icon: <Plus size={16} />,
      onClick: () => openCreateServerModal(),
    },
    {
      id: 'join',
      label: 'Join a Server',
      icon: <UserPlus size={16} />,
      onClick: () => show('Join server (coming soon)', 'info'),
    },
    {
      id: 'discover',
      label: 'Explore Communities',
      icon: <Compass size={16} />,
      onClick: () => show('Discover (coming soon)', 'info'),
    },
  ])

  return (
    <div className={styles.serverList}>
      {/* Home */}
      <Tooltip content="Home" position="right">
        <button
          className={`${styles.serverButton} ${styles.homeButton} ${currentServerId === null ? styles.activeServer : ''}`}
          onClick={() => { setCurrentServer(null); navigate('/channels/@me') }}
        >
          <Home size={22} />
          <div className={styles.activePill} />
        </button>
      </Tooltip>

      <div className={styles.divider} />

      {/* Folders */}
      {folders.map(folder => (
        <div key={folder.id} className={`${styles.folderContainer} ${folder.isCollapsed ? styles.collapsed : ''}`}>
          <Tooltip content={folder.name} position="right">
            <button
              className={styles.folderIcon}
              onClick={() => toggleFolder(folder.id)}
              style={{ backgroundColor: folder.color }}
            >
              {folder.isCollapsed
                ? <Folder size={22} fill="currentColor" />
                : <div className={styles.folderOpenIndicator} />}
            </button>
          </Tooltip>
          <div className={styles.folderServers}>
            {folder.serverIds.map(sid => {
              const server = servers.find(s => s.id === sid)
              if (!server) return null
              return (
                <ServerButton
                  key={server.id}
                  server={server}
                  isActive={currentServerId === server.id}
                  onClick={() => handleServerClick(server)}
                />
              )
            })}
          </div>
        </div>
      ))}

      {/* Standalone servers */}
      {standaloneServers.map(server => (
        <ServerButton
          key={server.id}
          server={server}
          isActive={currentServerId === server.id}
          onClick={() => handleServerClick(server)}
        />
      ))}

      {/* Add / Create server */}
      <Tooltip content="Add a server" position="right">
        <button
          className={`${styles.serverButton} ${styles.addButton}`}
          onClick={() => openCreateServerModal()}
          onContextMenu={addMenuTrigger}
        >
          <Plus size={22} />
        </button>
      </Tooltip>

      <div className={styles.divider} />

      {/* Discover */}
      <Tooltip content="Discover" position="right">
        <button
          className={styles.serverButton}
          onClick={() => show('Server discovery coming soon!', 'info')}
        >
          <Compass size={22} />
        </button>
      </Tooltip>
    </div>
  )
}
