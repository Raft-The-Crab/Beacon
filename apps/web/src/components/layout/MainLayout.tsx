import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useUIStore } from '../../stores/useUIStore'
import { useServerStore } from '../../stores/useServerStore'
import { ServerList } from './ServerList'
import { Sidebar } from './Sidebar'
import { ChatArea } from '../chat/ChatArea'
import { MemberList } from './MemberList'
import { QuickSwitcher } from '../features/QuickSwitcher'
import { Menu } from 'lucide-react'
import styles from './MainLayout.module.css'

export function MainLayout() {
  const { serverId, channelId } = useParams<{ serverId: string; channelId: string }>()
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false)

  const setCurrentChannel = useUIStore(state => state.setCurrentChannel)
  const storeCurrentChannelId = useUIStore(state => state.currentChannelId)
  const showMemberList = useUIStore(state => state.showMemberList)

  const setCurrentServer = useServerStore(state => state.setCurrentServer)
  const servers = useServerStore(state => state.servers)
  const storeCurrentServer = useServerStore(state => state.currentServer)

  // Cmd+K / Ctrl+K global quick switcher
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      setShowQuickSwitcher(prev => !prev)
    }
    if (e.key === 'Escape' && showQuickSwitcher) {
      setShowQuickSwitcher(false)
    }
  }, [showQuickSwitcher])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (serverId && storeCurrentServer?.id !== serverId) {
      setCurrentServer(serverId)
    }

    if (storeCurrentServer && serverId === storeCurrentServer.id) {
      if (channelId && storeCurrentChannelId !== channelId) {
        setCurrentChannel(channelId)
      } else if (!channelId && storeCurrentServer.channels && storeCurrentServer.channels.length > 0 && storeCurrentChannelId !== storeCurrentServer.channels[0].id) {
        setCurrentChannel(storeCurrentServer.channels[0].id)
      }
    }
  }, [
    serverId,
    channelId,
    servers,
    setCurrentServer,
    setCurrentChannel,
    storeCurrentServer,
    storeCurrentChannelId,
  ])

  const targetServer = servers.find(s => s.id === serverId) || null

  if (serverId && servers.length === 0) {
    return (
      <div className={styles.layout}>
        <ServerList />
        <div className={styles.loadingView}>
          <div className={styles.spinner}></div>
          <span>Syncing Beacon...</span>
        </div>
      </div>
    )
  }

  if (serverId && !targetServer) {
    return (
      <div className={styles.layout}>
        <ServerList />
        <div className={styles.loadingView}>
          <span>Server not found or loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      <button
        className={styles.mobileMenuBtn}
        onClick={() => useUIStore.getState().setShowMobileSidebar(true)}
      >
        <Menu size={24} />
      </button>
      <ServerList />
      <Sidebar />
      <ChatArea channelId={channelId || (targetServer?.channels?.[0]?.id) || ''} />
      {showMemberList && <MemberList />}

      {showQuickSwitcher && (
        <QuickSwitcher onClose={() => setShowQuickSwitcher(false)} />
      )}
    </div>
  )
}
