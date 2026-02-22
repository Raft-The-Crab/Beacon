import { useState, useEffect } from "react"
import {
  Users,
  PlusCircle,
  MessageSquare,
  Compass,
  Crown,
  Coins,
  Search,
  Moon,
  Settings,
  HelpCircle,
  Menu,
  Wifi,
  WifiOff,
} from "lucide-react"
import { useDMStore } from "../stores/useDMStore"
import { useAuthStore } from "../stores/useAuthStore"
import { useUserListStore } from "../stores/useUserListStore"
import { useUIStore } from "../stores/useUIStore"
import { useBeacoinStore } from "../stores/useBeacoinStore"
import { openUserSettingsModal } from "../utils/modals"
import { Avatar, Tooltip, Modal } from "../components/ui"
import { ChatArea } from "../components/chat/ChatArea"
import { useToast } from "../components/ui"
import { NotificationBell } from "../components/features/NotificationInbox"
import { BeacoinWallet } from "../components/features/BeacoinWallet"
import { BeaconPlusStore } from "./BeaconPlusStore"
import { ServerBoosting } from "../components/features/ServerBoosting"
import { InviteView } from "../components/features/InviteView"
import { AddFriendModal } from "../components/features/AddFriendModal"
import { CreateDMModal } from "../components/features/CreateDMModal"
import { WorkspaceLayout } from "../components/layout/WorkspaceLayout"
import { AuraOrbs } from "../components/ui/AuraOrbs"
import { useLowBandwidthStore } from "../stores/useLowBandwidthStore"
import { BeaconNotesModal } from "../components/modals/BeaconNotesModal"
import styles from "./MessagingHome.module.css"

type FriendTab = "online" | "all" | "pending" | "blocked"

const THEMES: string[] = ['dark', 'glass', 'oled', 'light', 'neon', 'midnight']

export function MessagingHome() {
  const { channels, setActiveChannel, activeChannel } = useDMStore()
  const { user } = useAuthStore()
  const { friends, blockedUsers } = useUserListStore()
  const { balance, fetchWallet } = useBeacoinStore()
  const [currentTab, setCurrentTab] = useState<FriendTab>("online")
  const [friendSearch, setFriendSearch] = useState("")
  const [showWallet, setShowWallet] = useState(false)
  const [showStore, setShowStore] = useState(false)
  const [showBoosting, setShowBoosting] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [showCreateDM, setShowCreateDM] = useState(false)
  const { show } = useToast()
  const ui = useUIStore()
  const { enabled: lowBandwidth, toggle: toggleLowBandwidth } = useLowBandwidthStore()
  const [showNotes, setShowNotes] = useState(false)

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
        : currentTab === "blocked" ? blockedFriendsList
          : allFriends
    if (!friendSearch.trim()) return base
    return base.filter((f) =>
      f.username.toLowerCase().includes(friendSearch.toLowerCase())
    )
  }

  const displayedFriends = getTabFriends()

  const tabLabel = () => {
    switch (currentTab) {
      case "online": return `Online — ${onlineFriends.length}`
      case "all": return `All Friends — ${allFriends.length}`
      case "pending": return `Pending — 0`
      case "blocked": return `Blocked — ${blockedFriendsList.length}`
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
          className={`${styles.navButton} ${!activeChannel ? styles.navActive : ""}`}
          onClick={handleFriendsClick}
        >
          <Users size={20} />
          <span>Friends</span>
        </button>

        <button
          className={`${styles.navButton} ${styles.premiumButton}`}
          onClick={() => setShowStore(true)}
        >
          <Crown size={20} color="#f0b232" />
          <span>Beacon+</span>
        </button>

        <button className={styles.navButton} onClick={() => setShowStore(true)}>
          <Compass size={20} />
          <span>Discover</span>
        </button>

        <button className={styles.navButton} onClick={() => setShowWallet(true)}>
          <Coins size={20} />
          <span>Shop</span>
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
            <div
              key={channel.id}
              className={`${styles.dmItem} ${activeChannel === channel.id ? styles.dmItemActive : ""}`}
              onClick={() => handleDMClick(channel.id)}
            >
              <Avatar
                username={channel.participants[0]?.username}
                status={channel.participants[0]?.status as any}
                size="sm"
              />
              <div className={styles.dmName}>
                {channel.participants[0]?.username || "Unknown"}
              </div>
            </div>
          ))
        )}
      </div>

      {/* User Area — always pinned to bottom */}
      <div className={styles.userArea}>
        <div className={styles.userPanel} onClick={() => setShowNotes(true)}>
          <Avatar
            username={user?.username || "Guest"}
            src={user?.avatar ?? undefined}
            status={user?.status as any || "online"}
            size="sm"
          />
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.username || "Guest"}</div>
            <div className={styles.userStatusRow}>
              {/* @ts-ignore */}
              {user?.statusEmoji && <span className={styles.miniEmoji}>{user.statusEmoji}</span>}
              <div className={styles.userStatusText}>
                {/* @ts-ignore */}
                {user?.statusText || getStatusLabel(user?.status)}
              </div>
            </div>
          </div>
        </div>
        <div className={styles.userControls}>
          <Tooltip content="Beacoins" position="top">
            <button className={styles.beacoinBtn} onClick={() => setShowWallet(true)}>
              <Coins size={13} />
              <span>{balance.toLocaleString()}</span>
            </button>
          </Tooltip>
          <Tooltip content={lowBandwidth ? "Low Bandwidth: ON" : "Low Bandwidth: OFF"} position="top">
            <button
              className={`${styles.iconCtrlBtn} ${lowBandwidth ? styles.iconCtrlBtnActive : ""}`}
              onClick={toggleLowBandwidth}
            >
              {lowBandwidth ? <WifiOff size={16} /> : <Wifi size={16} />}
            </button>
          </Tooltip>
          <Tooltip content="Settings" position="top">
            <button className={styles.iconCtrlBtn} onClick={() => openUserSettingsModal()}>
              <Settings size={16} />
            </button>
          </Tooltip>
          <Tooltip content="Switch Theme" position="top">
            <button
              className={styles.iconCtrlBtn}
              onClick={() => {
                const next = THEMES[(THEMES.indexOf(ui.theme) + 1) % THEMES.length]
                ui.setTheme(next as any)
              }}
            >
              <Moon size={16} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  )

  // ─── Right Panel ─────────────────────────────────────────────────
  const rightPanel = (
    <div className={styles.activeNowContainer}>
      <h3 className={styles.activeNowTitle}>Active Now</h3>
      <div className={styles.activeNowContent}>
        {onlineFriends.length > 0 ? (
          <div>
            {onlineFriends.slice(0, 8).map((friend) => (
              <div key={friend.id} className={styles.activeFriend}>
                <Avatar
                  username={friend.username}
                  src={friend.avatar ?? undefined}
                  status={friend.status as any}
                  size="sm"
                />
                <div className={styles.activeFriendInfo}>
                  <div className={styles.activeFriendName}>{friend.username}</div>
                  <div className={styles.activeFriendStatus}>{getStatusLabel(friend.status)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.activeNowEmpty}>
            <Compass size={40} />
            <h4>It's quiet for now...</h4>
            <p>Friends you interact with will show up here</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={styles.pageWrapper}>
      <AuraOrbs />
      <WorkspaceLayout sidebar={sidebar} rightPanel={rightPanel}>
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
                      className={`${styles.tab} ${currentTab === tab ? styles.tabActive : ""}`}
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
            <div className={styles.friendsBody}>
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
                  displayedFriends.map(friend => (
                    <div
                      key={friend.id}
                      className={styles.friendRow}
                      onClick={() => show(`Profile: ${friend.username}`, 'info')}
                    >
                      <Avatar
                        username={friend.username}
                        src={friend.avatar ?? undefined}
                        status={friend.status as any}
                        size="md"
                      />
                      <div className={styles.friendInfo}>
                        <div className={styles.friendName}>{friend.username}</div>
                        <div style={{ color: getStatusColor(friend.status), fontSize: 12 }}>
                          {getStatusLabel(friend.status)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.chatWrapper}>
            <ChatArea channelId={activeChannel} />
          </div>
        )}

        {showWallet && <BeacoinWallet onClose={() => setShowWallet(false)} />}
        <Modal isOpen={showStore} onClose={() => setShowStore(false)} size="lg" title="Beacon+ Store">
          <BeaconPlusStore />
        </Modal>
        <Modal isOpen={showBoosting} onClose={() => setShowBoosting(false)} size="md">
          <ServerBoosting onClose={() => setShowBoosting(false)} />
        </Modal>
        <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} size="md">
          <InviteView />
        </Modal>
        <Modal isOpen={showAddFriend} onClose={() => setShowAddFriend(false)} size="md">
          <AddFriendModal onClose={() => setShowAddFriend(false)} />
        </Modal>
        <Modal isOpen={showCreateDM} onClose={() => setShowCreateDM(false)} size="sm">
          <CreateDMModal onClose={() => setShowCreateDM(false)} />
        </Modal>

        <BeaconNotesModal isOpen={showNotes} onClose={() => setShowNotes(false)} />
      </WorkspaceLayout>
    </div>
  )
}
