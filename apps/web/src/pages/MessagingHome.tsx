import { useState, useEffect } from "react"
import {
  Users,
  PlusCircle,
  MessageSquare,
  Compass,
  Search,
  Moon,
  Settings,
  HelpCircle,
} from "lucide-react"
import { useDMStore } from "../stores/useDMStore"
import { useAuthStore } from "../stores/useAuthStore"
import { useUserListStore } from "../stores/useUserListStore"
import { useUIStore } from "../stores/useUIStore"
import { openUserSettingsModal } from "../utils/modals"
import { Avatar, Tooltip } from "../components/ui"
import { ChatArea } from "../components/chat/ChatArea"
import { useToast } from "../components/ui"
import { api } from "../lib/api"
import { NotificationBell } from "../components/features/NotificationInbox"
import { BeacoinWallet } from "../components/features/BeacoinWallet"
import { WorkspaceLayout } from "../components/layout/WorkspaceLayout"
import styles from "./MessagingHome.module.css"

type FriendTab = "online" | "all" | "pending" | "blocked" | "add"

export function MessagingHome() {
  const { channels, setActiveChannel, activeChannel } = useDMStore()
  const { user } = useAuthStore()
  const { friends, blockedUsers } = useUserListStore()
  const [currentTab, setCurrentTab] = useState<FriendTab>("online")
  const [friendSearch, setFriendSearch] = useState("")
  const [addFriendInput, setAddFriendInput] = useState("")
  const [addFriendLoading, setAddFriendLoading] = useState(false)

  const [showWallet, setShowWallet] = useState(false)
  const { show } = useToast()
  const ui = useUIStore()

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

  const handleDMClick = (channelId: string) => {
    setActiveChannel(channelId)
  }

  const handleFriendsClick = () => {
    setActiveChannel(null)
  }

  const onlineFriends = friends.filter(
    (f) => f.status === "online" || f.status === "idle" || f.status === "dnd"
  )
  const allFriends = friends
  const blockedFriendsList = friends.filter((f) => blockedUsers.includes(f.id))

  const getTabFriends = () => {
    const base =
      currentTab === "online"
        ? onlineFriends
        : currentTab === "blocked"
          ? blockedFriendsList
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
      case "add": return "Add Friend"
    }
  }

  const handleAddFriend = async () => {
    if (!addFriendInput.trim()) return
    setAddFriendLoading(true)
    try {
      await api.post("/friends/request", { username: addFriendInput.trim() })
      show(`Friend request sent to ${addFriendInput.trim()}!`, "success")
      setAddFriendInput("")
    } catch {
      show("Could not send friend request. Check the username and try again.", "error")
    } finally {
      setAddFriendLoading(false)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online": return "var(--status-online)"
      case "idle": return "var(--status-idle)"
      case "dnd": return "var(--status-dnd)"
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

  const sidebar = (
    <div className={styles.sideNavContent}>
      <div className={styles.searchBar}>
        <button className={styles.searchInput} onClick={() => ui.setShowQuickSwitcher(true)}>
          Find or start a conversation
        </button>
      </div>

      <div className={styles.navList}>
        <button
          className={`${styles.navButton} ${!activeChannel ? styles.active : ""}`}
          onClick={handleFriendsClick}
        >
          <Users size={24} />
          <span>Friends</span>
        </button>

        <button className={styles.navButton} onClick={() => show("Discover coming soon", "info")}>
          <Compass size={24} />
          <span>Discover</span>
        </button>

        <div className={styles.dmHeader}>
          <span>Direct Messages</span>
          <Tooltip content="Create DM" position="top">
            <button className={styles.iconButton} onClick={() => show("Create DM (placeholder)", "info")}>
              <PlusCircle size={16} />
            </button>
          </Tooltip>
        </div>

        <div className={styles.dmListScroll}>
          {channels.length === 0 ? (
            <div className={styles.emptyDMs}>
              <MessageSquare size={48} className={styles.icon} />
              <p>Start a new conversation or add a friend!</p>
            </div>
          ) : (
            channels.map((channel) => (
              <div
                key={channel.id}
                className={`${styles.dmItem} ${activeChannel === channel.id ? styles.active : ""}`}
                onClick={() => handleDMClick(channel.id)}
              >
                <Avatar
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${channel.participants[0]?.username}`}
                  status={channel.participants[0]?.status as any}
                  size="md"
                />
                <div className={styles.dmName}>{channel.participants[0]?.username}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.userArea}>
        <div className={styles.userPanel} onClick={() => openUserSettingsModal()}>
          <Avatar
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || "Guest"}`}
            status="online"
            size="sm"
          />
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.username || "Guest"}</div>
            <div className={styles.userStatus}>{(user as any)?.customStatus || "#0000"}</div>
          </div>
        </div>
        <div className={styles.userControls}>
          <Tooltip content="Settings" position="top">
            <button onClick={() => openUserSettingsModal()} className={styles.userControlButton}>
              <Settings size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Switch Theme" position="top">
            <button
              className={styles.userControlButton}
              onClick={() => {
                const themes: any[] = ['dark', 'glass', 'oled', 'light', 'neon', 'midnight']
                const next = themes[(themes.indexOf(ui.theme) + 1) % themes.length]
                ui.setTheme(next)
              }}
            >
              <Moon size={18} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div >
  )

  const rightPanel = (
    <div className={styles.activeNowContainer}>
      <h3 className={styles.activeNowTitle}>Active Now</h3>
      <div className={styles.activeNowContent}>
        {onlineFriends.length > 0 ? (
          <div className={styles.activeNowList}>
            {onlineFriends.slice(0, 8).map((friend) => (
              <div key={friend.id} className={styles.activeFriend}>
                <Avatar
                  src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
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
            <Compass size={48} />
            <h4>It's quiet for now...</h4>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <WorkspaceLayout sidebar={sidebar} rightPanel={rightPanel}>
      {!activeChannel ? (
        <div className={styles.friendsWrapper}>
          <header className={styles.topBar}>
            <div className={styles.topBarLeft}>
              <Users size={24} />
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
                  className={`${styles.addFriendButton} ${currentTab === "add" ? styles.tabActive : ""}`}
                  onClick={() => setCurrentTab("add")}
                >
                  Add Friend
                </button>
              </div>
            </div>
            <div className={styles.topBarRight}>
              <NotificationBell />
              <button
                className={styles.userControlButton}
                title="Help & Documentation"
                onClick={() => window.open("/docs", "_blank")}
              >
                <HelpCircle size={20} />
              </button>
            </div>
          </header>

          <div className={styles.friendsContainer}>
            {currentTab === "add" ? (
              <div className={styles.addFriendForm}>
                <h3>Add Friend</h3>
                <p>You can add friends with their Beacon username.</p>
                <div className={styles.addFriendInputWrapper}>
                  <input
                    type="text"
                    value={addFriendInput}
                    onChange={(e) => setAddFriendInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
                    placeholder="Enter a username…"
                  />
                  <button onClick={handleAddFriend} disabled={addFriendLoading || !addFriendInput.trim()}>
                    {addFriendLoading ? "Sending…" : "Send Request"}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.friendsListWrapper}>
                <div className={styles.friendsSearch}>
                  <Search size={16} />
                  <input
                    placeholder="Search"
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                  />
                </div>
                <div className={styles.friendsList}>{tabLabel()}</div>
                {/* Simplified list for brevity in this refactor step */}
                {displayedFriends.map(friend => (
                  <div key={friend.id} className={styles.friendRow}>
                    <Avatar src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} status={friend.status as any} size="md" />
                    <div className={styles.friendInfo}>
                      <div className={styles.friendName}>{friend.username}</div>
                      <div style={{ color: getStatusColor(friend.status), fontSize: 12 }}>{getStatusLabel(friend.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.chatWrapper}>
          <ChatArea channelId={activeChannel} />
        </div>
      )}
      {showWallet && <BeacoinWallet onClose={() => setShowWallet(false)} />}
    </WorkspaceLayout>
  )
}
