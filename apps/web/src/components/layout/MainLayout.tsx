import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUIStore } from '../../stores/useUIStore'
import { useServerStore } from '../../stores/useServerStore'
import { WorkspaceLayout } from './WorkspaceLayout'
import { Sidebar } from './Sidebar'
import { ChatArea } from '../chat/ChatArea'
import { MemberList } from './MemberList'
import { QuickSwitcher } from '../features/QuickSwitcher'
import { ServerSearchPanel } from './ServerSearchPanel'
import { motion, AnimatePresence } from 'framer-motion'
import styles from '../../styles/modules/layout/MainLayout.module.css'

export function MainLayout() {
  const { serverId, channelId } = useParams<{ serverId: string; channelId: string }>()
  const navigate = useNavigate()
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const setCurrentChannel = useUIStore(state => state.setCurrentChannel)
  const storeCurrentChannelId = useUIStore(state => state.currentChannelId)
  const showMemberList = useUIStore(state => state.showMemberList)

  const setCurrentServer = useServerStore(state => state.setCurrentServer)
  const servers = useServerStore(state => state.servers)
  const storeCurrentServer = useServerStore(state => state.currentServer)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Toggle Search (Ctrl + F)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault()
      setShowSearch(prev => !prev)
    }

    if (e.key === 'Escape') {
      if (showQuickSwitcher) setShowQuickSwitcher(false)
      if (showSearch) setShowSearch(false)
    }

    // Toggle Member List
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
      e.preventDefault()
      useUIStore.getState().toggleMemberList()
    }

    // Channel Navigation (Alt + Up/Down)
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      const server = useServerStore.getState().currentServer
      if (!server || !server.channels) return

      const channels = server.channels.filter((c: any) => c.type !== 4 && c.type !== 'CATEGORY')
      const currentIndex = channels.findIndex((c: any) => c.id === storeCurrentChannelId)

      if (e.key === 'ArrowUp') {
        const prevIndex = (currentIndex - 1 + channels.length) % channels.length
        const prevChannel = channels[prevIndex]
        if (prevChannel) useUIStore.getState().setCurrentChannel(prevChannel.id)
      } else {
        const nextIndex = (currentIndex + 1) % channels.length
        const nextChannel = channels[nextIndex]
        if (nextChannel) useUIStore.getState().setCurrentChannel(nextChannel.id)
      }
    }
  }, [showQuickSwitcher, storeCurrentChannelId])

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
  const targetChannels = targetServer?.channels || []
  const hasRouteChannel = !!channelId && targetChannels.some((c: any) => c.id === channelId)
  const hasStoredChannel = !!storeCurrentChannelId && targetChannels.some((c: any) => c.id === storeCurrentChannelId)
  const resolvedChannelId = hasRouteChannel
    ? (channelId as string)
    : hasStoredChannel
      ? (storeCurrentChannelId as string)
      : (targetChannels[0]?.id || '')

  useEffect(() => {
    if (!serverId || !targetServer || !channelId) return
    if (targetChannels.length === 0) return
    if (!hasRouteChannel) {
      navigate(`/channels/${serverId}/${resolvedChannelId}`, { replace: true })
    }
  }, [serverId, targetServer, channelId, targetChannels, hasRouteChannel, resolvedChannelId, navigate])

  if (serverId && servers.length === 0) {
    return (
      <WorkspaceLayout showServerRail sidebar={<div className={styles.loadingSidebar} />}>
        <div className={styles.loadingView}>
          <div className={styles.spinner}></div>
          <span>Syncing Beacon...</span>
        </div>
      </WorkspaceLayout>
    )
  }

  if (serverId && !targetServer) {
    return (
      <WorkspaceLayout showServerRail sidebar={<div className={styles.loadingSidebar} />}>
        <div className={styles.loadingView}>
          <span>Server not found or loading...</span>
        </div>
      </WorkspaceLayout>
    )
  }

  return (
    <WorkspaceLayout
      showServerRail
      sidebar={<Sidebar />}
      rightPanel={showMemberList ? <MemberList /> : undefined}
    >
       <div className={styles.chatContainer}>
        <AnimatePresence mode="wait">
          <motion.div
            key={resolvedChannelId}
            initial={{ opacity: 0, scale: 0.995, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.005, y: -4 }}
            transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
            className={styles.motionWrapper}
          >
            <ChatArea channelId={resolvedChannelId} />
          </motion.div>
        </AnimatePresence>
      </div>

      {showQuickSwitcher && (
        <QuickSwitcher onClose={() => setShowQuickSwitcher(false)} />
      )}

      {showSearch && (
        <ServerSearchPanel onClose={() => setShowSearch(false)} />
      )}
    </WorkspaceLayout>
  )
}
