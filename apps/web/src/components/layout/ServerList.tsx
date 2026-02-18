import { Home, Plus, Compass, Folder, Settings, UserPlus, LogOut, Bell, BellOff, Copy, Hash } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useServerStore } from '../../stores/useServerStore'
import { useUIStore } from '../../stores/useUIStore'
import { useToast } from '../ui'
import { openCreateServerModal } from '../../utils/modals'
import { useContextMenuTrigger } from '../ui/ContextMenu'
import styles from './ServerList.module.css'

// ── Individual server button with its own context menu ──────
function ServerButton({ server, isActive, onClick }: {
  server: any
  isActive: boolean
  onClick: () => void
}) {
  const navigate = useNavigate()
  const { show } = useToast()
  const setShowServerSettings = useUIStore(s => s.setShowServerSettings)

  const onContextMenu = useContextMenuTrigger([
    {
      id: 'mark-read',
      label: 'Mark as Read',
      icon: <Hash size={16} />,
      onClick: () => show('Marked as read', 'success'),
    },
    {
      id: 'invite',
      label: 'Invite People',
      icon: <UserPlus size={16} />,
      onClick: () => show('Invite link copied!', 'success'),
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
    <button
      className={`${styles.serverButton} ${isActive ? styles.activeServer : ''}`}
      title={server.name}
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
      <button
        className={`${styles.serverButton} ${styles.homeButton} ${currentServerId === null ? styles.activeServer : ''}`}
        title="Home"
        onClick={() => { setCurrentServer(null); navigate('/channels/@me') }}
      >
        <Home size={22} />
        <div className={styles.activePill} />
      </button>

      <div className={styles.divider} />

      {/* Folders */}
      {folders.map(folder => (
        <div key={folder.id} className={`${styles.folderContainer} ${folder.isCollapsed ? styles.collapsed : ''}`}>
          <button
            className={styles.folderIcon}
            onClick={() => toggleFolder(folder.id)}
            style={{ backgroundColor: folder.color }}
            title={folder.name}
          >
            {folder.isCollapsed
              ? <Folder size={22} fill="currentColor" />
              : <div className={styles.folderOpenIndicator} />}
          </button>
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
      <button
        className={`${styles.serverButton} ${styles.addButton}`}
        title="Add a server"
        onClick={() => openCreateServerModal()}
        onContextMenu={addMenuTrigger}
      >
        <Plus size={22} />
      </button>

      <div className={styles.divider} />

      {/* Discover */}
      <button
        className={styles.serverButton}
        title="Discover communities"
        onClick={() => show('Server discovery coming soon!', 'info')}
      >
        <Compass size={22} />
      </button>
    </div>
  )
}
