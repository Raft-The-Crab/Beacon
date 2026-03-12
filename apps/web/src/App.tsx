import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

import { MainLayout } from './components/layout/MainLayout'
import { ToastContainer, useToast } from './components/ui'
import { wsClient, WebSocketEvent } from './services'
import { useMessageStore } from './stores/useMessageStore'
import { usePinnedMessagesStore } from './stores/usePinnedMessagesStore'
import { useServerStore } from './stores/useServerStore'
import { useUserListStore } from './stores/useUserListStore'
import { useDMStore } from './stores/useDMStore'
import { useAuthStore } from './stores/useAuthStore'
import { useBeacoinStore } from './stores/useBeacoinStore'
import { usePresenceStore } from './stores/usePresenceStore'
import { useUIStore } from './stores/useUIStore'
import { activitySync } from './services/ActivitySyncService'
import { HelmetProvider } from 'react-helmet-async'
import { ModalManager } from './components/modals'
import { KeyboardShortcutsPanel } from './components/ui/KeyboardShortcutsPanel'
import { isAndroid } from './utils/platform'

import { ContextMenuProvider } from './components/ui/ContextMenu'
import { VersionCheck } from './components/utils/VersionCheck'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/globals.css'
import './styles/themes.css'
import './styles/discord-utils.css'

// Route-level lazy loading for better startup performance
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })))
const MessagingHome = lazy(() => import('./pages/MessagingHome').then(m => ({ default: m.MessagingHome })))
const DeveloperPortal = lazy(() => import('./pages/DeveloperPortal').then(m => ({ default: m.DeveloperPortal })))
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const UserProfile = lazy(() => import('./pages/UserProfile').then(m => ({ default: m.UserProfile })))
const ServerSettings = lazy(() => import('./pages/ServerSettings').then(m => ({ default: m.ServerSettings })))
const VoiceChannel = lazy(() => import('./pages/VoiceChannel').then(m => ({ default: m.VoiceChannel })))
const AboutUs = lazy(() => import('./pages/AboutUs').then(m => ({ default: m.AboutUs })))
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })))
const Terms = lazy(() => import('./pages/legal/Terms').then(m => ({ default: m.Terms })))
const Privacy = lazy(() => import('./pages/legal/Privacy').then(m => ({ default: m.Privacy })))
const TOS = lazy(() => import('./pages/legal/TOS').then(m => ({ default: m.TOS })))
const License = lazy(() => import('./pages/legal/License').then(m => ({ default: m.License })))
const DocsHome = lazy(() => import('./pages/docs/DocsHome').then(m => ({ default: m.DocsHome })))
const GettingStarted = lazy(() => import('./pages/docs/GettingStarted').then(m => ({ default: m.GettingStarted })))
const SDKTutorial = lazy(() => import('./pages/docs/SDKTutorial').then(m => ({ default: m.SDKTutorial })))
const APIReference = lazy(() => import('./pages/docs/APIReference').then(m => ({ default: m.APIReference })))
const GatewayDocs = lazy(() => import('./pages/docs/GatewayDocs').then(m => ({ default: m.GatewayDocs })))
const Mission = lazy(() => import('./pages/docs/Mission').then(m => ({ default: m.Mission })))
const BotCommands = lazy(() => import('./pages/docs/BotCommands').then(m => ({ default: m.BotCommands })))
const BeaconPlusStore = lazy(() => import('./pages/BeaconPlusStore').then(m => ({ default: m.BeaconPlusStore })))
const SafetyHub = lazy(() => import('./pages/SafetyHub').then(m => ({ default: m.SafetyHub })))
const PartnerPortal = lazy(() => import('./pages/PartnerPortal').then(m => ({ default: m.PartnerPortal })))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })))

function RouteFallback() {
  return (
    <div style={{ height: '100%', width: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
      Loading...
    </div>
  )
}

export function App() {
  const { toasts, remove } = useToast()
  const syncTheme = useUIStore((s) => s.syncTheme)
  const handleMessageCreate = useMessageStore((s) => s.handleMessageCreate)
  const handleMessageUpdate = useMessageStore((s) => s.handleMessageUpdate)
  const handleMessageDelete = useMessageStore((s) => s.handleMessageDelete)
  const pinMessage = usePinnedMessagesStore((s) => s.pinMessage)
  const unpinMessage = usePinnedMessagesStore((s) => s.unpinMessage)
  const setPresence = usePresenceStore((s) => s.setPresence)

  const isMobilePlatform = isAndroid()

  React.useEffect(() => {
    syncTheme()
  }, [syncTheme])

  const eagerLoadServers = useServerStore(s => s.eagerLoad)
  const eagerLoadFriends = useUserListStore(s => s.eagerLoad)
  const eagerLoadChannels = useDMStore(s => s.eagerLoad)
  const fetchWallet = useBeacoinStore(s => s.fetchWallet)
  const checkSession = useAuthStore(s => s.checkSession)
  const user = useAuthStore(s => s.user)

  // Hydrate auth state from token/cookie on initial mount.
  useEffect(() => {
    checkSession().catch(err => console.error('Session hydration failed', err))
  }, [checkSession])

  // Initial Data Fetch (Eager Loading for zero lag)
  useEffect(() => {
    if (user?.id) {
      // Parallel eager loading
      Promise.all([
        eagerLoadServers(),
        eagerLoadFriends(),
        eagerLoadChannels(),
        fetchWallet()
      ]).catch(err => console.error('Initial eager load failed', err))

      // Start Activity Sync Service
      activitySync.start();
    }
  }, [user?.id, eagerLoadServers, eagerLoadFriends, eagerLoadChannels, fetchWallet])

  // Eager-load critical routes after first paint while leaving the rest lazy.
  useEffect(() => {
    const preload = () => {
      void import('./pages/MessagingHome')
      void import('./pages/Login')
      void import('./pages/BeaconPlusStore')
      void import('./pages/ServerSettings')
      void import('./pages/DeveloperPortal')
    }

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number
      cancelIdleCallback?: (id: number) => void
    }

    if (typeof w.requestIdleCallback === 'function') {
      const idleId = w.requestIdleCallback(preload)
      return () => {
        if (typeof w.cancelIdleCallback === 'function') {
          w.cancelIdleCallback(idleId)
        }
      }
    }

    const timeout = setTimeout(preload, 250)
    return () => clearTimeout(timeout)
  }, [])

  // Global WS event handler to sync incoming events into local stores
  React.useEffect(() => {
    const handler = (event: WebSocketEvent) => {
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
        case 'MESSAGE_REACTION_ADD':
        case 'MESSAGE_REACTION_REMOVE':
          handleMessageUpdate(data.channelId || data.channel_id, data.messageId, { reactions: data.reactions })
          break
        case 'PRESENCE_UPDATE':
          setPresence(data.user_id, data.status, data.custom_status, data.activities)
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

  const location = useLocation()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        style={{ height: '100%', width: '100%' }}
      >
        <HelmetProvider>
          <ErrorBoundary>
            <ContextMenuProvider>
              <ModalManager>
                <div className="mesh-container">
                  <div className="mesh-gradient" />
                  <div className="mesh-noise" />
                </div>

                <Suspense fallback={<RouteFallback />}>
                  <Routes location={location}>
                  {/* Entry Point */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />

                  {/* Legal & About (Windows or Non-Android only) */}
                  {!isMobilePlatform && (
                    <>
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/license" element={<License />} />
                      <Route path="/safety" element={<TOS />} />
                      <Route path="/about" element={<AboutUs />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/docs" element={<DocsHome />} />
                      <Route path="/docs/getting-started" element={<GettingStarted />} />
                      <Route path="/docs/mission" element={<Mission />} />
                      <Route path="/docs/sdk-tutorial" element={<SDKTutorial />} />
                      <Route path="/docs/api-reference" element={<APIReference />} />
                      <Route path="/docs/gateway-events" element={<GatewayDocs />} />
                      <Route path="/docs/bot-commands" element={<BotCommands />} />
                    </>
                  )}

                  {/* Main App Routes (Universal) */}
                  <Route path="/channels" element={<Navigate to="/channels/@me" replace />} />
                  <Route path="/channels/@me" element={<MessagingHome />} />
                  <Route path="/channels/:serverId" element={<MainLayout />} />
                  <Route path="/channels/:serverId/:channelId" element={<MainLayout />} />

                  {/* Developer Features (Windows Only) */}
                  {!isMobilePlatform && (
                    <>
                      <Route path="/developer" element={<DeveloperPortal />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                    </>
                  )}

                  {/* Universal Sub-routes */}
                  <Route path="/user/:userId" element={<UserProfile />} />
                  <Route path="/server/:serverId/settings" element={<ServerSettings />} />
                  <Route path="/voice" element={<VoiceChannel />} />
                  <Route path="/plus" element={<BeaconPlusStore />} />
                  <Route path="/shop" element={<BeaconPlusStore />} />
                  <Route path="/safety-hub" element={<SafetyHub />} />
                  <Route path="/partner" element={<PartnerPortal />} />

                  {/* Redirect everything else to Messaging Home */}
                  <Route path="*" element={<Navigate to="/channels/@me" replace />} />
                  </Routes>
                </Suspense>
                <ToastContainer toasts={toasts} onRemove={remove} />
                <KeyboardShortcutsPanel />
                <VersionCheck />
              </ModalManager>
            </ContextMenuProvider>
          </ErrorBoundary>
        </HelmetProvider>
      </motion.div>
    </AnimatePresence>
  )
}

export default function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}

