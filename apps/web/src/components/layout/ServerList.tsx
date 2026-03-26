import { Home, Plus, Compass, Folder, Settings, UserPlus, LogOut, Copy, Hash, Zap } from 'lucide-react'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useServerStore } from '../../stores/useServerStore'
import { useUIStore } from '../../stores/useUIStore'
import { openCreateServerModal, openCreateChannelModal } from '../../utils/modals'
import { useContextMenuTrigger } from '../ui/ContextMenu'
import { Modal, Tooltip, useToast } from '../ui'
import styles from '../../styles/modules/layout/ServerList.module.css'

function ServerIconShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className={`${styles.serverIcon} glass`}
      whileHover={{ scale: 1.1, borderRadius: '16px' }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
    >
      {children}
    </motion.div>
  )
}

// -- Individual server button with its own context menu ------
function ServerButton({ server, isActive, onClick }: {
  server: any
  isActive: boolean
  onClick: () => void
}) {
  const { show } = useToast()
  const setShowServerSettings = useUIStore(s => s.setShowServerSettings)
  const leaveGuild = useServerStore(s => s.leaveGuild)

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
        openCreateChannelModal('text')
      },
    },
    {
      id: 'create-category',
      label: 'Create Category',
      icon: <Folder size={16} />,
      divider: true,
      onClick: () => {
        onClick()
        openCreateChannelModal('category')
      },
    },
    {
      id: 'copy-id',
      label: 'Copy Server ID',
      icon: <Copy size={16} />,
      shortcut: '?C',
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
      onClick: async () => {
        try {
          await leaveGuild(server.id)
          show('You left the server', 'success')
          window.location.href = '/channels/@me'
        } catch (err: any) {
          const message = err?.response?.data?.error || 'Unable to leave this server'
          show(message, 'error')
        }
      },
    },
  ])

  return (
    <Tooltip content={server.name} position="right">
      <button
        className={`${styles.serverButton} ${isActive ? styles.activeServer : ''}`}
        onClick={onClick}
        onContextMenu={onContextMenu}
        aria-label={`${server.name} server${isActive ? ' (active)' : ''}`}
        aria-current={isActive ? 'true' : undefined}
      >
        <ServerIconShell>
          {server.icon ? (
            <img src={server.icon} alt={server.name} className={styles.serverIconImg} />
          ) : (
            <span>{server.name.charAt(0).toUpperCase()}</span>
          )}
        </ServerIconShell>
        {/* Active indicator pill */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 40, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={styles.activePill}
            />
          )}
        </AnimatePresence>
      </button>
    </Tooltip>
  )
}

// -- Main ServerList ------------------------------------------
export function ServerList({ className }: { className?: string }) {
  const navigate = useNavigate()
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinInput, setJoinInput] = useState('')
  const joinInputRef = useRef<HTMLInputElement>(null)
  const { show } = useToast()
  const servers = useServerStore(state => state.servers)
  const folders = useServerStore(state => state.folders)
  const currentServerId = useServerStore(state => state.currentServerId)
  const setCurrentServer = useServerStore(state => state.setCurrentServer)
  const fetchGuild = useServerStore(state => state.fetchGuild)
  const toggleFolder = useServerStore(state => state.toggleFolder)

  const serversInFolders = new Set(folders.flatMap(f => f.serverIds))
  const standaloneServers = servers.filter(s => !serversInFolders.has(s.id))

  const handleServerClick = async (server: any) => {
    setCurrentServer(server.id)

    let targetServer = server
    const hasChannels = Array.isArray(server?.channels) && server.channels.length > 0
    if (!hasChannels) {
      try {
        await fetchGuild(server.id)
        targetServer = useServerStore.getState().servers.find((s) => s.id === server.id) || targetServer
      } catch {
        // keep current server fallback route below
      }
    }

    const channels = Array.isArray(targetServer?.channels) ? targetServer.channels : []
    const preferredChannel = channels.find((ch: any) => String(ch?.type).toLowerCase() === 'text' || ch?.type === 0) || channels[0]

    if (preferredChannel?.id) {
      navigate(`/channels/${server.id}/${preferredChannel.id}`)
      return
    }

    navigate(`/channels/${server.id}`)
  }

  const extractInviteCode = (input: string): string => {
    const trimmed = input.trim()
    if (!trimmed) return ''
    const fromUrl = trimmed.match(/\/invites\/([^/?#]+)/i) || trimmed.match(/\/invite\/([^/?#]+)/i)
    if (fromUrl?.[1]) return fromUrl[1]
    const bareCode = trimmed.match(/^([a-z0-9_-]{4,64})$/i)
    return bareCode?.[1] || trimmed
  }

  const handleJoinByInvite = () => {
    setJoinInput('')
    setShowJoinModal(true)
    setTimeout(() => joinInputRef.current?.focus(), 50)
  }

  const handleJoinSubmit = async () => {
    if (!joinInput.trim()) return
    const inviteCode = extractInviteCode(joinInput)
    if (!inviteCode) {
      show('Invalid invite code', 'error')
      return
    }
    setShowJoinModal(false)
    navigate(`/invite/${encodeURIComponent(inviteCode)}`)
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
      onClick: handleJoinByInvite,
    },
    {
      id: 'discover',
      label: 'Explore Communities',
      icon: <Compass size={16} />,
      onClick: () => navigate('/discovery'),
    },
  ])

  const leftRailMenuTrigger = useContextMenuTrigger([
    {
      id: 'create-channel',
      label: 'Create Channel',
      icon: <Hash size={16} />,
      onClick: () => openCreateChannelModal('text'),
    },
    {
      id: 'create-category',
      label: 'Create Category',
      icon: <Folder size={16} />,
      onClick: () => openCreateChannelModal('category'),
    },
    {
      id: 'divider-1',
      label: '',
      divider: true,
    },
    {
      id: 'create-server',
      label: 'Create a Server',
      icon: <Plus size={16} />,
      onClick: () => openCreateServerModal(),
    },
    {
      id: 'join-server',
      label: 'Join a Server',
      icon: <UserPlus size={16} />,
      onClick: handleJoinByInvite,
    },
    {
      id: 'explore',
      label: 'Explore Communities',
      icon: <Compass size={16} />,
      onClick: () => navigate('/discovery'),
    },
  ])

  return (
    <div className={`${styles.serverList} ${className || ''}`} onContextMenu={leftRailMenuTrigger}>
      {/* Home */}
      <Tooltip content="Home" position="right">
        <button
          className={`${styles.serverButton} ${styles.homeButton} ${currentServerId === null ? styles.activeServer : ''}`}
          onClick={() => { setCurrentServer(null); navigate('/channels/@me') }}
        >
          <ServerIconShell>
            <Home size={22} />
          </ServerIconShell>
          <AnimatePresence>
            {currentServerId === null && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 40, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={styles.activePill}
              />
            )}
          </AnimatePresence>
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
          <ServerIconShell>
            <Plus size={22} />
          </ServerIconShell>
        </button>
      </Tooltip>

      <div className={styles.divider} />

      {/* Discover */}
      <Tooltip content="Discover" position="right">
        <button
          className={styles.serverButton}
          onClick={() => navigate('/discovery')}
        >
          <ServerIconShell>
            <Compass size={22} />
          </ServerIconShell>
        </button>
      </Tooltip>

      {/* Join by Invite Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join a Server"
        size="sm"
        className={styles.joinModal}
      >
        <div className={styles.joinModalBody}>
          <p className={styles.joinModalDescription}>Paste an invite link or code below.</p>
          <input
            ref={joinInputRef}
            type="text"
            placeholder="Invite code or URL"
            value={joinInput}
            onChange={e => setJoinInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void handleJoinSubmit() }}
            className={styles.joinInput}
          />
          <div className={styles.joinActions}>
            <button
              onClick={() => setShowJoinModal(false)}
              className={styles.joinSecondaryButton}
            >
              Cancel
            </button>
            <button
              onClick={() => void handleJoinSubmit()}
              disabled={!joinInput.trim()}
              className={styles.joinPrimaryButton}
            >
              Join
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
