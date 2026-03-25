import { useState, useEffect } from "react"
import { Virtuoso } from "react-virtuoso"
import { motion } from "framer-motion"
import {
  Users,
  PlusCircle,
  MessageSquare,
  Compass,
  Crown,
  Coins,
  Search,
  Menu,
  HelpCircle,
} from "lucide-react"
import { useDMStore } from "../stores/useDMStore"
import { useUserListStore } from "../stores/useUserListStore"
import { useUIStore } from "../stores/useUIStore"
import { useBeacoinStore } from "../stores/useBeacoinStore"
import { useAuthStore } from "../stores/useAuthStore"
import { api } from "../lib/api"

import { Avatar, Tooltip, Modal } from "../components/ui"
import { ChatArea } from "../components/chat/ChatArea"
import { useToast } from "../components/ui"
import { WorkspaceLayout } from "../components/layout/WorkspaceLayout"
import { CreateDMModal } from "../components/features/CreateDMModal"
import { AddFriendModal } from "../components/features/AddFriendModal"
import { BeacoinWallet } from "../components/features/BeacoinWallet"
import { ServerBoosting } from "../components/features/ServerBoosting"
import { InviteView } from "../components/features/InviteView"
import { ServerDiscovery } from "../components/features/ServerDiscovery"
import { ActivityPanel } from "../components/features/ActivityPanel"
import { OnboardingFlow } from "../components/features/OnboardingFlow"
import { CurrentUserControls } from "../components/features/CurrentUserControls"
import { AuraOrbs } from "../components/ui/AuraOrbs"
import { NotificationBell } from "../components/features/NotificationInbox"
import { UserPopoverCard } from "../components/features/UserPopoverCard"
import { BeaconPlusStore } from "./BeaconPlusStore"
import styles from "../styles/modules/pages/MessagingHome.module.css"

type FriendTab = "online" | "all" | "pending" | "blocked"

export function MessagingHome() {
  const { channels, setActiveChannel, activeChannel } = useDMStore()
  const user = useAuthStore((state) => state.user)
  const { friends, blockedUsers, fetchFriends } = useUserListStore()
  const [pendingFriends, setPendingFriends] = useState<any[]>([])
  const [currentTab, setCurrentTab] = useState<FriendTab>("all")
  const [friendSearch, setFriendSearch] = useState("")
  const [showWallet, setShowWallet] = useState(false)
  const [showBoosting, setShowBoosting] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [showCreateDM, setShowCreateDM] = useState(false)
  const [showDiscover, setShowDiscover] = useState(false)
  const [showBeaconPlus, setShowBeaconPlus] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { show } = useToast()
  const ui = useUIStore()

  const { fetchWallet } = useBeacoinStore()

  const getDMParticipant = (channel: any) =>
    channel.participants.find((participant: any) => participant.id !== user?.id) || channel.participants[0]

  const loadPendingFriends = async () => {
    try {
      const { data } = await api.get('/friends/pending')
      setPendingFriends(Array.isArray(data) ? data : [])
    } catch {
      setPendingFriends([])
    }
  }

  useEffect(() => {
    const handleOpenBoost = () => setShowBoosting(true)
    const handleOpenInvite = () => setShowInvite(true)
    window.addEventListener('open-server-boost', handleOpenBoost)
    window.addEventListener('open-server-invite', handleOpenInvite)
    return () => {
      window.removeEventListener('open-server-boost', handleOpenBoost)
      window.removeEventListener('open-server-invite', handleOpenInvite)
    }
  }, [])

  useEffect(() => {
    fetchWallet()
  }, [fetchWallet])

  useEffect(() => {
    if (friends.length === 0) {
      void fetchFriends()
    }
  }, [friends.length, fetchFriends])

  useEffect(() => {
    void loadPendingFriends()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        ui.setShowQuickSwitcher(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [ui])

  const handleDMClick = (channelId: string) => setActiveChannel(channelId)
  const handleFriendsClick = () => setActiveChannel(null)

  const onlineFriends = friends.filter(
    (f) => f.status === "online" || f.status === "idle" || f.status === "dnd"
  )
  const allFriends = friends
  const blockedFriendsList = friends.filter((f) => blockedUsers.includes(f.id))

  const getTabFriends = () => {
    const base =
      currentTab === "online" ? onlineFriends
        : currentTab === "pending" ? pendingFriends
          : currentTab === "blocked" ? blockedFriendsList
            : allFriends
    if (!friendSearch.trim()) return base
    return base.filter((f) =>
      `${f.displayName || ''} ${f.username || ''}`.toLowerCase().includes(friendSearch.toLowerCase())
    )
  }

  const displayedFriends = getTabFriends()

  const tabLabel = () => {
    switch (currentTab) {
      case "online": return `Online — ${onlineFriends.length} `
      case "all": return `All Friends — ${allFriends.length} `
      case "pending": return `Pending — ${pendingFriends.length}`
      case "blocked": return `Blocked — ${blockedFriendsList.length} `
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online": return "var(--status-online, #23a559)"
      case "idle": return "var(--status-idle, #f0b232)"
      case "dnd": return "var(--status-dnd, #f23f43)"
      default: return "var(--text-muted)"
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "online": return "Online"
      case "idle": return "Idle"
      case "dnd": return "Do Not Disturb"
      default: return "Offline"
    }
  }

  const handleAcceptPending = async (friendId: string, username: string) => {
    try {
      await api.put(`/friends/${friendId}/accept`)
      show(`Accepted friend request from ${username}`, 'success')
      await Promise.all([fetchFriends(), loadPendingFriends()])
    } catch {
      show('Failed to accept friend request', 'error')
    }
  }

  const handleDeclinePending = async (friendId: string, username: string) => {
    try {
      await api.delete(`/friends/${friendId}`)
      show(`Declined friend request from ${username}`, 'info')
      await loadPendingFriends()
    } catch {
      show('Failed to decline friend request', 'error')
    }
  }

  // ─── Sidebar ─────────────────────────────────────────────────────
  const sidebar = (
    <div className={styles.sideNavContent}>
      {/* Search / Quick Switcher */}
      <div className={styles.searchBar}>
        <button
          className={styles.searchInput}
          onClick={() => ui.setShowQuickSwitcher(true)}
        >
          <Search size={14} style={{ marginRight: 8, opacity: 0.5, flexShrink: 0 }} />
          Find or start a conversation
        </button>
      </div>

      {/* Nav Buttons */}
      <div className={styles.navSection}>
        <button
          className={`${styles.navButton} ${!activeChannel ? styles.navActive : ""} `}
          onClick={handleFriendsClick}
        >
          <Users size={20} />
          <span>Friends</span>
        </button>

        <button
          className={`${styles.navButton} ${styles.premiumButton} `}
          onClick={() => setShowBeaconPlus(true)}
        >
          <Crown size={20} color="#f0b232" />
          <span>Beacon+</span>
        </button>

        <button className={styles.navButton} onClick={() => setShowDiscover(true)}>
          <Compass size={20} />
          <span>Discover</span>
        </button>

        <button className={styles.navButton} onClick={() => setShowWallet(true)}>
          <Coins size={20} />
          <span>Beacoins</span>
        </button>
      </div>

      {/* DM Header */}
      <div className={styles.dmSectionHeader}>
        <span>Direct Messages</span>
        <Tooltip content="New Message" position="right">
          <button className={styles.dmAddBtn} onClick={() => setShowCreateDM(true)}>
            <PlusCircle size={16} />
          </button>
        </Tooltip>
      </div>

      {/* DM List — flex: 1 to fill remaining space */}
      <div className={styles.dmList}>
        {channels.length === 0 ? (
          <div className={styles.dmEmpty}>
            <MessageSquare size={40} opacity={0.25} />
            <p>Start a new conversation<br />or add a friend!</p>
          </div>
        ) : (
          channels.map((channel) => (
            (() => {
              const dmParticipant = getDMParticipant(channel)
              return (
                <div
                  key={channel.id}
                  className={`${styles.dmItem} ${activeChannel === channel.id ? styles.dmItemActive : ""} `}
                  onClick={() => handleDMClick(channel.id)}
                >
                  <Avatar
                    username={dmParticipant?.username}
                    status={dmParticipant?.status as any}
                    size="sm"
                  />
                  <div className={styles.dmName}>
                    {dmParticipant?.username || "Unknown"}
                  </div>
                </div>
              )
            })()
          ))
        )}
      </div>

      <CurrentUserControls />
    </div>
  )

  // ─── Right Panel ─────────────────────────────────────────────────
  const rightPanel = !activeChannel ? (
    <div className={styles.activeNowContainer}>
      <ActivityPanel />
    </div>
  ) : undefined

  return (
    <div className={styles.pageWrapper}>
      <AuraOrbs />
      <WorkspaceLayout showServerRail sidebar={sidebar} rightPanel={rightPanel}>
        {!activeChannel ? (
          <div className={styles.friendsWrapper}>
            {/* Top Bar */}
            <header className={styles.topBar}>
              <div className={styles.topBarLeft}>
                <button
                  className={styles.menuButton}
                  onClick={() => ui.setShowMobileSidebar(true)}
                >
                  <Menu size={20} />
                </button>
                <Users size={20} />
                <h2 className={styles.topBarTitle}>Friends</h2>
                <div className={styles.divider} />
                <div className={styles.tabs}>
                  {(["online", "all", "pending", "blocked"] as FriendTab[]).map((tab) => (
                    <button
                      key={tab}
                      className={`${styles.tab} ${currentTab === tab ? styles.tabActive : ""} `}
                      onClick={() => setCurrentTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                  <button
                    className={styles.addFriendBtn}
                    onClick={() => setShowAddFriend(true)}
                  >
                    Add Friend
                  </button>
                </div>
              </div>
              <div className={styles.topBarRight}>
                <NotificationBell />
                <Tooltip content="Help" position="left">
                  <button
                    className={styles.iconCtrlBtn}
                    onClick={() => window.open("/docs", "_blank")}
                  >
                    <HelpCircle size={18} />
                  </button>
                </Tooltip>
              </div>
            </header>

            {/* Friends Content */}
            <motion.div
              className={styles.friendsBody}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Search */}
              <div className={styles.friendsSearchRow}>
                <div className={styles.friendsSearchWrap}>
                  <Search size={14} className={styles.friendsSearchIcon} />
                  <input
                    className={styles.friendsSearchInput}
                    placeholder="Search"
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Tab Label */}
              <div className={styles.friendsLabel}>{tabLabel()}</div>

              {/* Friends List */}
              <div className={styles.friendsScroll}>
                {displayedFriends.length === 0 ? (
                  <div className={styles.friendsEmpty}>
                    <Users size={48} opacity={0.2} />
                    <p>{currentTab === "online" ? "No friends online right now." : "No friends to show."}</p>
                  </div>
                ) : (
                  <Virtuoso
                    data={displayedFriends}
                    itemContent={(_index, friend) => (
                      <div
                        key={friend.id}
                        className={styles.friendRow}
                      >
                        <UserPopoverCard
                          userId={friend.id}
                          username={friend.username}
                          displayName={friend.displayName ?? undefined}
                          banner={friend.banner ?? undefined}
                          avatar={friend.avatar ?? undefined}
                          status={friend.status as any}
                          customStatus={friend.customStatus ?? undefined}
                          bio={friend.bio ?? undefined}
                          badges={friend.badges}
                          joinedAt={friend.createdAt}
                          avatarDecorationId={friend.avatarDecorationId ?? undefined}
                          profileEffectId={friend.profileEffectId ?? undefined}
                          onAddFriend={undefined}
                        >
                          <Avatar
                            username={friend.displayName || friend.username}
                            src={friend.avatar ?? undefined}
                            status={friend.status as any}
                            size="md"
                            avatarDecorationId={friend.avatarDecorationId ?? undefined}
                          />
                        </UserPopoverCard>
                        <div className={styles.friendInfo}>
                          <div className={styles.friendName}>{friend.displayName || friend.username}</div>
                          <div style={{ color: getStatusColor(friend.status), fontSize: 12 }}>
                            {friend.customStatus || getStatusLabel(friend.status)}
                          </div>
                        </div>
                        {currentTab === 'pending' && (
                          <div className={styles.friendActions}>
                            <button
                              className={styles.pendingActionBtn}
                              type="button"
                              onClick={() => void handleAcceptPending(friend.id, friend.username)}
                            >
                              Accept
                            </button>
                            <button
                              className={styles.pendingActionBtn}
                              type="button"
                              onClick={() => void handleDeclinePending(friend.id, friend.username)}
                            >
                              Ignore
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  />
                )}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className={styles.chatWrapper}>
            <ChatArea channelId={activeChannel} />
          </div>
        )}

        {showWallet && <BeacoinWallet onClose={() => setShowWallet(false)} />}
        <Modal isOpen={showBoosting} onClose={() => setShowBoosting(false)} size="md" noPadding={true}>
          <ServerBoosting onClose={() => setShowBoosting(false)} />
        </Modal>
        <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} size="md" noPadding={true}>
          <InviteView />
        </Modal>
        <Modal isOpen={showAddFriend} onClose={() => setShowAddFriend(false)} size="md" noPadding={true}>
          <AddFriendModal
            onClose={() => setShowAddFriend(false)}
            onSuccess={() => {
              void loadPendingFriends()
              void fetchFriends()
            }}
          />
        </Modal>
        <Modal isOpen={showCreateDM} onClose={() => setShowCreateDM(false)} size="sm" noPadding={true}>
          <CreateDMModal onClose={() => setShowCreateDM(false)} />
        </Modal>

        <Modal isOpen={showDiscover} onClose={() => setShowDiscover(false)} size="lg" noPadding={true} hideHeader={true} scrollable={false}>
          <div className={styles.discoveryModalShell}>
            <button
              onClick={() => setShowDiscover(false)}
              className={styles.discoveryCloseButton}
            >
              ✕
            </button>
            <ServerDiscovery />
          </div>
        </Modal>

        <Modal isOpen={showBeaconPlus} onClose={() => setShowBeaconPlus(false)} size="xl" noPadding={true} hideHeader={true} scrollable={false}>
          <div className={styles.beaconPlusModalShell}>
            <BeaconPlusStore onClose={() => setShowBeaconPlus(false)} />
          </div>
        </Modal>

        <OnboardingFlow
          serverName="Beacon Community"
          isOpen={showOnboarding}
          onSkip={() => setShowOnboarding(false)}
          onComplete={(selections) => {
            console.log('Onboarding complete', selections)
            setShowOnboarding(false)
            show('Welcome to the server!', 'success')
          }}
        />
      </WorkspaceLayout>
    </div>
  )
}
