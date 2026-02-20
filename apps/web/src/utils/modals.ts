import { useUIStore } from '../stores/useUIStore'

export function openUserProfileModal(userId: string) {
  const { setShowUserProfile, setSelectedUser } = useUIStore.getState()
  setSelectedUser(userId)
  setShowUserProfile(true)
}

export function openServerSettingsModal() {
  const { setShowServerSettings } = useUIStore.getState()
  setShowServerSettings(true)
}

export function openSettingsModal() {
  const { setShowUserSettings } = useUIStore.getState()
  setShowUserSettings(true)
}

export function openUserSettingsModal() {
  const { setShowUserSettings } = useUIStore.getState()
  setShowUserSettings(true)
}

export function openDeveloperPortalModal() {
  const { setShowDeveloperPortal } = useUIStore.getState()
  setShowDeveloperPortal(true)
}

export function openLandingPageModal() {
  const { setShowLandingPage } = useUIStore.getState()
  setShowLandingPage(true)
}

export function openLoginPageModal() {
  const { setShowLoginPage } = useUIStore.getState()
  setShowLoginPage(true)
}

export function openMessagingHomeModal() {
  const { setShowMessagingHome } = useUIStore.getState()
  setShowMessagingHome(true)
}

export function openVoiceChannelModal() {
  const { setShowVoiceChannel } = useUIStore.getState()
  setShowVoiceChannel(true)
}

export function openCreateServerModal() {
  const { setShowCreateServer } = useUIStore.getState()
  setShowCreateServer(true)
}

export function openCreateChannelModal(_type?: string, _parentId?: string) {
  const { setShowCreateChannel } = useUIStore.getState()
  // Note: If you want to store type/parentId in store, you'd add state for it.
  // For now, we just open the modal.
  setShowCreateChannel(true)
}
