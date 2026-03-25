import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

import { MainLayout } from './components/layout/MainLayout'
import { Modal, ToastContainer, useToast, CommandPalette } from './components/ui'
import { wsClient, WebSocketEvent } from './services'
import { apiClient } from './services/apiClient'
import { useMessageStore } from './stores/useMessageStore'
import { usePinnedMessagesStore } from './stores/usePinnedMessagesStore'
import { useServerStore } from './stores/useServerStore'
import { useRolesStore } from './stores/useRolesStore'
import { useUserListStore } from './stores/useUserListStore'
import { useTranslationStore } from './stores/useTranslationStore'
import { useDMStore } from './stores/useDMStore'
import { useAuthStore } from './stores/useAuthStore'
import { useBeacoinStore } from './stores/useBeacoinStore'
import { usePresenceStore } from './stores/usePresenceStore'
import { useNotificationStore } from './stores/useNotificationStore'
import { useUIStore } from './stores/useUIStore'
import { useVoiceStore } from './stores/useVoiceStore'
import { activitySync } from './services/ActivitySyncService'
import { HelmetProvider } from 'react-helmet-async'
import { ModalManager } from './components/modals'
import { KeyboardShortcutsPanel } from './components/ui/KeyboardShortcutsPanel'
import { isAndroid } from './utils/platform'
import { ServerBoosting } from './components/features/ServerBoosting'
import { ServerInviteModal } from './components/modals/ServerInviteModal'

import { ContextMenuProvider } from './components/ui/ContextMenu'
import { VersionCheck } from './components/utils/VersionCheck'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/globals.css'
import './styles/themes.css'
import './styles/beacon-utils.css'

// Route-level lazy loading for better startup performance
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })))
const MessagingHome = lazy(() => import('./pages/MessagingHome').then(m => ({ default: m.MessagingHome })))
const DeveloperPortal = lazy(() => import('./pages/DeveloperPortal').then(m => ({ default: m.DeveloperPortal })))
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const MobileSplash = lazy(() => import('./pages/MobileSplash').then(m => ({ default: m.MobileSplash })))
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
const InvitePage = lazy(() => import('./pages/InvitePage').then(m => ({ default: m.InvitePage })))
const SafetyHub = lazy(() => import('./pages/SafetyHub').then(m => ({ default: m.SafetyHub })))
const PartnerPortal = lazy(() => import('./pages/PartnerPortal').then(m => ({ default: m.PartnerPortal })))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const Discovery = lazy(() => import('./pages/Discovery').then(m => ({ default: m.Discovery })))
const CommunityHub = lazy(() => import('./pages/CommunityHub').then(m => ({ default: m.CommunityHub })))
const AppDirectory = lazy(() => import('./pages/AppDirectory').then(m => ({ default: m.AppDirectory })))
const VerificationPage = lazy(() => import('./pages/VerificationPage').then(m => ({ default: m.VerificationPage })))
const Updates = lazy(() => import('./pages/Updates').then(m => ({ default: m.Updates })))
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })))

function RouteFallback() {
  return (
    <div style={{ height: '100%', width: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
      Loading...
    </div>
  )
}

// Renders Beacon+ as a modal route similar to in-app overlays.
function ShopRoute() {
  const navigate = useNavigate()
  const handleClose = () => navigate(-1)
  return (
    <Modal isOpen={true} onClose={handleClose} size="xl" noPadding={true} hideHeader={true}>
      <div style={{ height: '86vh', maxHeight: '86vh', overflow: 'hidden', background: 'var(--bg-primary)', borderRadius: 'var(--radius-2xl)' }}>
        <Suspense fallback={<RouteFallback />}>
          <BeaconPlusStore onClose={handleClose} />
        </Suspense>
      </div>
    </Modal>
  )
}

export function App() {
  const { toasts, remove } = useToast()
  const syncTheme = useUIStore((s) => s.syncTheme)
  const handleMessageCreate = useMessageStore((s) => s.handleMessageCreate)
  const handleMessageUpdate = useMessageStore((s) => s.handleMessageUpdate)
  const handleMessageDelete = useMessageStore((s) => s.handleMessageDelete)
    const handleGuildCreateWs = useServerStore((s) => s.handleGuildCreate)
    const handleGuildUpdateWs = useServerStore((s) => s.handleGuildUpdate)
    const handleChannelCreateWs = useServerStore((s) => s.handleChannelCreate)
    const handleChannelUpdateWs = useServerStore((s) => s.handleChannelUpdate)
    const handleChannelDeleteWs = useServerStore((s) => s.handleChannelDelete)
    const handleMemberRemoveWs = useServerStore((s) => s.handleMemberRemove)
  const pinMessage = usePinnedMessagesStore((s) => s.pinMessage)
  const unpinMessage = usePinnedMessagesStore((s) => s.unpinMessage)
  const setPresence = usePresenceStore((s) => s.setPresence)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications)
  const currentServer = useServerStore(s => s.currentServer)

  const [globalBoostOpen, setGlobalBoostOpen] = React.useState(false)
  const [globalInviteOpen, setGlobalInviteOpen] = React.useState(false)

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
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const verificationRequired = useAuthStore(s => s.verificationRequired)
  const isAuthLoading = useAuthStore(s => s.isLoading)
  const navigate = useNavigate()
  const setVoiceUserId = useVoiceStore((s) => s.setUserId)
  const hasAdminAccess = Boolean(user && (user.developerMode || user.badges?.includes('admin') || user.badges?.includes('owner')))

  const language = useTranslationStore(s => s.language)
  const setLanguage = useTranslationStore(s => s.setLanguage)

  // Smart Language Sync from User Profile
  useEffect(() => {
    if (user?.locale && language === 'en') {
      const normalizedLocale = user.locale.split('-')[0].toLowerCase()
      // Only sync if it's one of our supported languages
      const supportedLanguages = ['en', 'fr', 'de', 'zh', 'hi', 'ru', 'pt', 'ar', 'ko', 'it', 'nl', 'tr', 'vi', 'th', 'id']
      if (supportedLanguages.includes(normalizedLocale) && normalizedLocale !== 'en') {
        console.info(`[LOCALE] Auto-switching language to ${normalizedLocale} based on user profile.`)
        setLanguage(normalizedLocale)
      }
    }
  }, [user?.locale, language, setLanguage])

  useEffect(() => {
    const handleOpenBoost = () => setGlobalBoostOpen(true)
    const handleOpenInvite = () => setGlobalInviteOpen(true)
    window.addEventListener('open-server-boost', handleOpenBoost)
    window.addEventListener('open-server-invite', handleOpenInvite)
    return () => {
      window.removeEventListener('open-server-boost', handleOpenBoost)
      window.removeEventListener('open-server-invite', handleOpenInvite)
    }
  }, [])

  // Hydrate auth state from token/cookie on initial mount.
  useEffect(() => {
    // Only run session check once on mount
    void checkSession().catch(err => console.error('Session hydration failed', err))
  }, []) // Removed checkSession from deps as it's stable and we only want mount-check

  useEffect(() => {
    if (verificationRequired) {
      navigate('/verify')
    }
  }, [verificationRequired, navigate])

  // Initial Data Fetch (Eager Loading for zero lag)
  // We use references for functions to avoid dependency loops if stores re-render
  const eagerLoadRef = React.useRef({
    servers: eagerLoadServers,
    friends: eagerLoadFriends,
    channels: eagerLoadChannels,
    wallet: fetchWallet,
    notifications: fetchNotifications
  })

  useEffect(() => {
    if (user?.id) {
      const { servers, friends, channels, wallet, notifications } = eagerLoadRef.current
      // Parallel eager loading
      Promise.all([
        servers(),
        friends(),
        channels(),
        wallet(),
        notifications(),
      ]).catch(err => console.error('Initial eager load failed', err))

      // Start Activity Sync Service
      activitySync.start();
    }
  }, [user?.id]) // Only depends on user.id to trigger once per session

  useEffect(() => {
    setVoiceUserId(user?.id || null)
  }, [user?.id, setVoiceUserId])

  // Keep gateway websocket in sync with auth session so events reach all clients.
  useEffect(() => {
    const token = useAuthStore.getState().isAuthenticated ? apiClient.getAccessToken() : null
    if (!token) {
      wsClient.disconnect()
      return
    }
    void wsClient.connect(token)
    return () => {
      wsClient.disconnect()
    }
  }, [isAuthenticated, user?.id])

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
        case 'MESSAGE_REACTION':
          handleMessageUpdate(data.channelId || data.channel_id, data.messageId, { reactions: data.reactions })
          break
        case 'PRESENCE_UPDATE':
          setPresence(data.user_id, data.status, data.custom_status, data.activities)
          break
        case 'NOTIFICATION_CREATE':
          addNotification({
            id: String(data.id || Date.now()),
            type: data.type || 'info',
            priority: 'high',
            title: data.title || 'New notification',
            body: data.body || '',
            createdAt: data.createdAt,
            avatarUrl: data.avatarUrl,
            userId: data.userId,
            serverId: data.serverId,
            channelId: data.channelId,
          } as any)
          break
          case 'GUILD_CREATE':
            if (data) handleGuildCreateWs(data)
            break
          case 'GUILD_UPDATE':
            if (data?.guildId || data?.id) handleGuildUpdateWs(data.guildId || data.id, data.guild || data)
            break
          case 'GUILD_ROLE_CREATE':
            if (data?.guildId) useRolesStore.getState().fetchRoles(data.guildId)
            break
          case 'GUILD_ROLE_UPDATE':
            if (data?.guildId) useRolesStore.getState().fetchRoles(data.guildId)
            break
          case 'GUILD_ROLE_DELETE':
            if (data?.guildId) useRolesStore.getState().fetchRoles(data.guildId)
            break
          case 'GUILD_ROLES_REORDER':
            if (data?.guildId) useRolesStore.getState().fetchRoles(data.guildId)
            break
          case 'GUILD_MEMBER_UPDATE':
            // Member data updated (e.g. nick change) â€” re-fetch guild for member list accuracy
            if (data?.guildId) useServerStore.getState().fetchGuild(data.guildId)
            break
          case 'GUILD_MEMBER_REMOVE':
          case 'GUILD_MEMBER_BAN':
            if (data?.guildId && data?.userId) handleMemberRemoveWs(data.guildId, data.userId)
            break
          case 'CHANNEL_CREATE':
            if (data?.guildId) {
                handleChannelCreateWs(data)
            } else {
                useDMStore.getState().handleChannelCreateWs(data)
            }
            break
          case 'CHANNEL_UPDATE':
            if (data?.guildId && data?.id) handleChannelUpdateWs(data.guildId, data.id, data)
            break
          case 'CHANNEL_DELETE':
            if (data?.guildId && data?.id) handleChannelDeleteWs(data.guildId, data.id)
            break
        default:
          break
      }
    }

    wsClient.on('*', handler)
    return () => {
      wsClient.off('*', handler)
    }
  }, [handleMessageCreate, handleMessageUpdate, handleMessageDelete, pinMessage, unpinMessage, setPresence, addNotification, handleGuildCreateWs, handleGuildUpdateWs, handleChannelCreateWs, handleChannelUpdateWs, handleChannelDeleteWs, handleMemberRemoveWs])

  const location = useLocation()
  const appRouteRequiresAuth = location.pathname.startsWith('/channels') || location.pathname.startsWith('/server/') || location.pathname === '/voice'

  if (isAuthLoading && appRouteRequiresAuth) {
    return <RouteFallback />
  }

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
                  <Route path="/" element={isMobilePlatform ? <MobileSplash /> : <LandingPage />} />
                  <Route path="/welcome" element={<MobileSplash />} />
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/verify" element={<VerificationPage />} />
                  <Route path="/auth/reset-password" element={<ResetPassword />} />

                  {/* Public informational routes */}
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
                  <Route path="/discovery" element={<Discovery />} />
                  <Route path="/community" element={<CommunityHub />} />
                  <Route path="/apps" element={<AppDirectory />} />

                  {/* Main App Routes (Universal) */}
                  <Route path="/channels" element={isAuthenticated ? <Navigate to="/channels/@me" replace /> : <Navigate to="/login" replace />} />
                  <Route path="/channels/@me" element={isAuthenticated ? <MessagingHome /> : <Navigate to="/login" replace />} />
                  <Route path="/channels/:serverId" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />} />
                  <Route path="/channels/:serverId/:channelId" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />} />

                  {/* Developer Features (Windows Only) */}
                  {!isMobilePlatform && (
                    <>
                      <Route path="/developer" element={<DeveloperPortal />} />
                      <Route path="/admin" element={user ? (hasAdminAccess ? <AdminDashboard /> : <Navigate to="/channels/@me" replace />) : <Navigate to="/login" replace />} />
                    </>
                  )}

                  {/* Universal Sub-routes */}
                  <Route path="/user/:userId" element={<UserProfile />} />
                  <Route path="/server/:serverId/settings" element={isAuthenticated ? <ServerSettings /> : <Navigate to="/login" replace />} />
                  <Route path="/voice" element={isAuthenticated ? <VoiceChannel /> : <Navigate to="/login" replace />} />
                  <Route path="/plus" element={<ShopRoute />} />
                  <Route path="/shop" element={<ShopRoute />} />
                                    <Route path="/invite/:code" element={<InvitePage />} />
                  <Route path="/safety-hub" element={<SafetyHub />} />
                  <Route path="/partner" element={<PartnerPortal />} />
                  <Route path="/updates" element={<Updates />} />

                  {/* Redirect everything else to Messaging Home */}
                  <Route path="*" element={<Navigate to={user ? "/channels/@me" : "/"} replace />} />
                  </Routes>
                </Suspense>
                <ToastContainer />
                <CommandPalette />
                <KeyboardShortcutsPanel />
                <VersionCheck />

                {/* Global Modals */}
                <Modal isOpen={globalBoostOpen} onClose={() => setGlobalBoostOpen(false)} size="md" noPadding={true}>
                  <ServerBoosting onClose={() => setGlobalBoostOpen(false)} />
                </Modal>
                {currentServer && (
                  <ServerInviteModal
                    isOpen={globalInviteOpen}
                    onClose={() => setGlobalInviteOpen(false)}
                    serverId={currentServer.id}
                    serverName={currentServer.name}
                  />
                )}
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

