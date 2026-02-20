import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import {
  Login,
  MessagingHome,
  DeveloperPortal,
  LandingPage,
  UserProfile,
  ServerSettings,
  VoiceChannel,
  AboutUs,
  Contact,
  Terms,
  Privacy,
  TOS,
  DocsHome,
  GettingStarted,
  SDKTutorial,
  APIReference,
  GatewayDocs,
  Mission,
  BeaconPlusStore
} from './pages'
import { MainLayout } from './components/layout/MainLayout'
import { ToastContainer, useToast } from './components/ui'
import { wsClient } from './services/websocket'
import { useMessageStore } from './stores/useMessageStore'
import { usePinnedMessagesStore } from './stores/usePinnedMessagesStore'
import { useServerStore } from './stores/useServerStore'
import { useUserListStore } from './stores/useUserListStore'
import { useDMStore } from './stores/useDMStore'
import { useAuthStore } from './stores/useAuthStore'
import { useBeacoinStore } from './stores/useBeacoinStore'
import { HelmetProvider } from 'react-helmet-async'
import { ModalManager } from './components/modals'
import { KeyboardShortcutsPanel } from './components/ui/KeyboardShortcutsPanel'
import { isAndroid } from './utils/platform'
import { ThemeProvider } from './contexts/ThemeContext'
import { ThemeSynchronizer } from './components/ThemeToggle/ThemeSynchronizer'
import { ContextMenuProvider } from './components/ui/ContextMenu'
import { VersionCheck } from './components/utils/VersionCheck'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/globals.css'
import './styles/themes.css'
import './styles/ui-system.css'

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
  const fetchWallet = useBeacoinStore(s => s.fetchWallet)
  const user = useAuthStore(s => s.user)

  // Initial Data Fetch
  useEffect(() => {
    if (user) {
      fetchGuilds()
      fetchFriends()
      fetchChannels()
      fetchWallet()
    }
  }, [user, fetchGuilds, fetchFriends, fetchChannels, fetchWallet])

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
        <ErrorBoundary>
          <ContextMenuProvider>
            <ModalManager>
              <ThemeProvider>
                <ThemeSynchronizer />
                <Routes>
                {/* Entry Point */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/landing" element={<LandingPage />} />
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
                <Route path="/plus" element={<BeaconPlusStore />} />
                <Route path="/shop" element={<BeaconPlusStore />} />

                {/* Redirect everything else to Messaging Home */}
                <Route path="*" element={<Navigate to="/channels/@me" replace />} />
              </Routes>
            </ThemeProvider>
            <ToastContainer toasts={toasts} onRemove={remove} />
            <KeyboardShortcutsPanel />
            <VersionCheck />
          </ModalManager>
        </ContextMenuProvider>
      </ErrorBoundary>
    </HelmetProvider>
  </BrowserRouter>
  )
}

export default App
