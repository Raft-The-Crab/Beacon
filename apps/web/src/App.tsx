import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { MessagingHome } from './pages/MessagingHome'
import { DeveloperPortal } from './pages/DeveloperPortal'
import { UserProfile } from './pages/UserProfile'
import { ServerSettings } from './pages/ServerSettings'
import { VoiceChannel } from './pages/VoiceChannel'
import { MainLayout } from './components/layout/MainLayout'
import { ToastContainer, useToast } from './components/ui'
import { wsClient } from './services/websocket'
import { useMessageStore } from './stores/useMessageStore'
import { usePinnedMessagesStore } from './stores/usePinnedMessagesStore'
import { useServerStore } from './stores/useServerStore'
import { useUserListStore } from './stores/useUserListStore'
import { useDMStore } from './stores/useDMStore'
import { useAuthStore } from './stores/useAuthStore'
// Removed useUIStore import from here if only syncTheme was used
import { HelmetProvider } from 'react-helmet-async'
import { Terms } from './pages/legal/Terms'
import { Privacy } from './pages/legal/Privacy'
import { TOS } from './pages/legal/TOS'
import { AboutUs } from './pages/AboutUs'
import { Contact } from './pages/Contact'
import { DocsHome } from './pages/docs/DocsHome'
import { GettingStarted } from './pages/docs/GettingStarted'
import { SDKTutorial } from './pages/docs/SDKTutorial'
import { APIReference } from './pages/docs/APIReference'
import { GatewayDocs } from './pages/docs/GatewayDocs'
import { Mission } from './pages/docs/Mission'
import { ModalManager } from './components/modals'
import { KeyboardShortcutsPanel } from './components/ui/KeyboardShortcutsPanel'
import { isAndroid } from './utils/platform'
import { ThemeProvider } from './components/ThemeToggle/ThemeContext'
import { ThemeSynchronizer } from './components/ThemeToggle/ThemeSynchronizer'
import { ContextMenuProvider } from './components/ui/ContextMenu'
import './styles/globals.css'

function App() {
  const { toasts, remove } = useToast()
  // Removed syncTheme from here: const { syncTheme } = useUIStore()
  const handleMessageCreate = useMessageStore((s) => s.handleMessageCreate)
  const handleMessageUpdate = useMessageStore((s) => s.handleMessageUpdate)
  const handleMessageDelete = useMessageStore((s) => s.handleMessageDelete)
  const pinMessage = usePinnedMessagesStore((s) => s.pinMessage)
  const unpinMessage = usePinnedMessagesStore((s) => s.unpinMessage)

  const isMobilePlatform = isAndroid()

  // Removed this useEffect as syncTheme is no longer called directly
  // React.useEffect(() => {
  //   syncTheme()
  // }, [syncTheme])

  const fetchGuilds = useServerStore(s => s.fetchGuilds)
  const fetchFriends = useUserListStore(s => s.fetchFriends)
  const fetchChannels = useDMStore(s => s.fetchChannels)
  const user = useAuthStore(s => s.user)

  // Initial Data Fetch
  useEffect(() => {
    if (user) {
      fetchGuilds()
      fetchFriends()
      fetchChannels()
    }
  }, [user, fetchGuilds, fetchFriends, fetchChannels])

  // Global WS event handler to sync incoming events into local stores
  React.useEffect(() => {
    const handler = (event: any) => {
      const { type, data } = event
      switch (type) {
        case 'MESSAGE_CREATE':
          handleMessageCreate({ ...data, channelId: data.channel_id || data.channelId })
          break
        case 'MESSAGE_UPDATE':
          handleMessageUpdate(data.channel_id || data.channelId, data.id || data.message?.id, data)
          break
        case 'MESSAGE_DELETE':
          handleMessageDelete(data.channelId || data.channel_id, data.messageId)
          break
        case 'MESSAGE_PIN':
          pinMessage(data.channelId || data.channel_id, {
            id: data.message.id,
            channelId: data.channelId || data.message.channel_id,
            content: data.message.content,
            authorName: data.message.author?.username || data.message.author?.id || 'Unknown',
            authorAvatar: data.message.author?.avatar,
            timestamp: data.message.timestamp || data.message.createdAt,
            pinnedBy: data.message.pinnedBy || 'system',
            pinnedAt: new Date().toISOString(),
          })
          break
        case 'MESSAGE_UNPIN':
          unpinMessage(data.channelId || data.channel_id, data.message.id)
          break
        case 'MESSAGE_REACTION':
          handleMessageUpdate(data.channelId || data.channel_id, data.messageId, { reactions: data.reactions })
          break
        default:
          break
      }
    }

    wsClient.on('*', handler)
    return () => {
      wsClient.off('*', handler)
    }
  }, [handleMessageCreate, handleMessageUpdate, handleMessageDelete, pinMessage, unpinMessage])

  return (
    <BrowserRouter>
      <HelmetProvider>
        <ContextMenuProvider>
          <ModalManager>
            <ThemeProvider>
              <ThemeSynchronizer />
              <Routes>
                {/* Entry: always go to login first */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />

                {/* Legal & About (Windows or Non-Android only) */}
                {!isMobilePlatform && (
                  <>
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/safety" element={<TOS />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/docs" element={<DocsHome />} />
                    <Route path="/docs/getting-started" element={<GettingStarted />} />
                    <Route path="/docs/mission" element={<Mission />} />
                    <Route path="/docs/sdk-tutorial" element={<SDKTutorial />} />
                    <Route path="/docs/api-reference" element={<APIReference />} />
                    <Route path="/docs/gateway-events" element={<GatewayDocs />} />
                  </>
                )}

                {/* Main App Routes (Universal) */}
                <Route path="/channels" element={<Navigate to="/channels/@me" replace />} />
                <Route path="/channels/@me" element={<MessagingHome />} />
                <Route path="/channels/:serverId" element={<MainLayout />} />
                <Route path="/channels/:serverId/:channelId" element={<MainLayout />} />

                {/* Developer Features (Windows Only) */}
                {!isMobilePlatform && (
                  <Route path="/developer" element={<DeveloperPortal />} />
                )}

                {/* Universal Sub-routes */}
                <Route path="/user/:userId" element={<UserProfile />} />
                <Route path="/server/:serverId/settings" element={<ServerSettings />} />
                <Route path="/voice" element={<VoiceChannel />} />

                {/* Redirect everything else to Messaging Home */}
                <Route path="*" element={<Navigate to="/channels/@me" replace />} />
              </Routes>
            </ThemeProvider>
            <ToastContainer toasts={toasts} onRemove={remove} />
            <KeyboardShortcutsPanel />
          </ModalManager>
        </ContextMenuProvider>
      </HelmetProvider>
    </BrowserRouter>
  )
}

export default App
