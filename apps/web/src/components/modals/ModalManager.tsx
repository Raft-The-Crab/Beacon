import { createContext, useContext, ReactNode } from 'react'
import { UserProfileModal } from './UserProfileModal'
import { ServerSettingsModal } from './ServerSettingsModal'
import { SettingsModal } from './SettingsModal'
import { CreateServerModal } from './CreateServerModal'
import { CreateChannelModal } from './CreateChannelModal'
import { CallInterface } from '../features/CallInterface'
import { Modal } from '../ui/Modal'
import { useUIStore } from '../../stores/useUIStore'
import { useServerStore } from '../../stores/useServerStore'
import { CustomStatusModal } from './CustomStatusModal'
import { AuditLogModal } from './AuditLogModal'
import WebhooksManager from './WebhooksManager'
import GroupDMModal from '../features/GroupDMModal'
import { PinnedMessages } from '../features/PinnedMessages'
import { QuickSwitcherModal } from './QuickSwitcherModal'

interface ModalContextType {
  openModal: (modalName: string, props?: any) => void
  closeModal: (modalName: string) => void
  closeAllModals: () => void
  isModalOpen: (modalName: string) => boolean
}

const ModalContext = createContext<ModalContextType | null>(null)

interface ModalManagerProps {
  children: ReactNode
}

export function ModalManager({ children }: ModalManagerProps) {
  const ui = useUIStore()
  const serverStore = useServerStore()

  const openModal = (modalName: string, props?: any) => {
    if (modalName === 'userProfile') ui.setShowUserProfile(true)
    if (modalName === 'serverSettings') ui.setShowServerSettings(true)
    if (modalName === 'settings') ui.setShowUserSettings(true)
    if (modalName === 'createServer') ui.setShowCreateServer(true)
    if (modalName === 'createChannel') ui.setShowCreateChannel(true)
    if (modalName === 'customStatus') ui.setShowCustomStatus(true)
    if (modalName === 'groupDM') ui.setShowGroupDM(true)
    if (modalName === 'webhooks') ui.setShowWebhooks(true, props?.guildId)
    if (modalName === 'auditLog') ui.setShowAuditLog(true, props?.guildId)
    if (modalName === 'pinnedMessages') ui.setShowPinnedMessages(true, props?.channelId)
    if (modalName === 'quickSwitcher') ui.setShowQuickSwitcher(true)
  }

  const closeModal = (modalName: string) => {
    if (modalName === 'userProfile') ui.setShowUserProfile(false)
    if (modalName === 'serverSettings') ui.setShowServerSettings(false)
    if (modalName === 'settings') ui.setShowUserSettings(false)
    if (modalName === 'createServer') ui.setShowCreateServer(false)
    if (modalName === 'createChannel') ui.setShowCreateChannel(false)
    if (modalName === 'customStatus') ui.setShowCustomStatus(false)
    if (modalName === 'groupDM') ui.setShowGroupDM(false)
    if (modalName === 'webhooks') ui.setShowWebhooks(false)
    if (modalName === 'auditLog') ui.setShowAuditLog(false)
    if (modalName === 'pinnedMessages') ui.setShowPinnedMessages(false)
    if (modalName === 'quickSwitcher') ui.setShowQuickSwitcher(false)
  }

  const closeAllModals = () => {
    ui.setShowUserProfile(false)
    ui.setShowServerSettings(false)
    ui.setShowUserSettings(false)
    ui.setShowCreateServer(false)
    ui.setShowCreateChannel(false)
    ui.setShowCustomStatus(false)
    ui.setShowGroupDM(false)
    ui.setShowWebhooks(false)
    ui.setShowAuditLog(false)
    ui.setShowPinnedMessages(false)
    ui.setShowQuickSwitcher(false)
  }

  const isModalOpen = (modalName: string) => {
    if (modalName === 'userProfile') return ui.showUserProfile
    if (modalName === 'serverSettings') return ui.showServerSettings
    if (modalName === 'settings') return ui.showUserSettings
    if (modalName === 'createServer') return ui.showCreateServer
    if (modalName === 'createChannel') return ui.showCreateChannel
    if (modalName === 'customStatus') return ui.showCustomStatus
    if (modalName === 'groupDM') return ui.showGroupDM
    if (modalName === 'webhooks') return ui.showWebhooks
    if (modalName === 'auditLog') return ui.showAuditLog
    if (modalName === 'pinnedMessages') return ui.showPinnedMessages
    if (modalName === 'quickSwitcher') return ui.showQuickSwitcher
    return false
  }

  // Build guild channels list for webhooks manager
  const currentGuildChannels = (() => {
    const channels = serverStore.currentServer?.channels || []
    return channels
      .filter((c: any) => {
        const t = String(c.type).toLowerCase()
        return t === 'text' || t === '0' || c.type === 0
      })
      .map((c: any) => ({ id: c.id, name: c.name, type: 'text' as const }))
  })()

  return (
    <ModalContext.Provider value={{
      openModal,
      closeModal,
      closeAllModals,
      isModalOpen
    }}>
      {children}

      {/* ── Existing modals ── */}
      {ui.showUserProfile && (
        <UserProfileModal
          isOpen={true}
          userId={ui.selectedUserId || ''}
          onClose={() => ui.setShowUserProfile(false)}
        />
      )}

      {ui.showServerSettings && (
        <ServerSettingsModal
          isOpen={true}
          onClose={() => ui.setShowServerSettings(false)}
        />
      )}

      {ui.showUserSettings && (
        <SettingsModal
          isOpen={true}
          onClose={() => ui.setShowUserSettings(false)}
        />
      )}

      {ui.showCreateServer && (
        <CreateServerModal
          isOpen={true}
          onClose={() => ui.setShowCreateServer(false)}
        />
      )}

      {ui.showCreateChannel && (
        <CreateChannelModal
          isOpen={true}
          onClose={() => ui.setShowCreateChannel(false)}
        />
      )}

      {ui.showVoiceChannel && (
        <Modal isOpen={true} onClose={() => ui.setShowVoiceChannel(false)} size="xl" noPadding hideHeader>
          <div style={{ height: '80vh', display: 'flex' }}>
            <CallInterface
              callType="video"
              participants={[
                { id: '1', username: 'Alex', isMuted: false, isVideoOn: true, isSpeaking: true },
                { id: '2', username: 'Sarah', isMuted: true, isVideoOn: false, isSpeaking: false }
              ]}
              onEndCall={() => ui.setShowVoiceChannel(false)}
              onToggleMute={() => { }}
              onToggleVideo={() => { }}
              onToggleScreenShare={() => { }}
              isMuted={false}
              isVideoOn={true}
              isScreenSharing={false}
            />
          </div>
        </Modal>
      )}

      {/* ── New modals ── */}

      {ui.showCustomStatus && (
        <CustomStatusModal
          onClose={() => ui.setShowCustomStatus(false)}
        />
      )}

      {ui.showGroupDM && (
        <GroupDMModal
          onClose={() => ui.setShowGroupDM(false)}
        />
      )}

      {ui.showWebhooks && (
        <WebhooksManager
          guildId={ui.webhooksGuildId || serverStore.currentServerId || ''}
          channels={currentGuildChannels}
          onClose={() => ui.setShowWebhooks(false)}
        />
      )}

      {ui.showAuditLog && (
        <AuditLogModal
          guildId={ui.auditLogGuildId || serverStore.currentServerId || ''}
          onClose={() => ui.setShowAuditLog(false)}
        />
      )}

      {ui.showPinnedMessages && ui.pinnedMessagesChannelId && (
        <Modal
          isOpen={true}
          onClose={() => ui.setShowPinnedMessages(false)}
          size="md"
          title="📌 Pinned Messages"
        >
          <PinnedMessages
            channelId={ui.pinnedMessagesChannelId}
            onClose={() => ui.setShowPinnedMessages(false)}
            onJumpToMessage={(messageId: string) => {
              ui.setShowPinnedMessages(false)
              // Scroll to message in chat — component can handle this via URL hash or event
              const el = document.getElementById(`msg-${messageId}`)
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
          />
        </Modal>
      )}

      {ui.showQuickSwitcher && (
        <QuickSwitcherModal
          isOpen={true}
          onClose={() => ui.setShowQuickSwitcher(false)}
        />
      )}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalManager')
  }
  return context
}
