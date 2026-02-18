import { useState } from "react"
import {
  Users,
  Settings,
  PlusCircle,
  MessageSquare,
  Compass,
  Mic,
  Headphones,
  HelpCircle,
  UserPlus,
  Search,
} from "lucide-react"
import { useDMStore } from "../stores/useDMStore"
import { useAuthStore } from "../stores/useAuthStore"
import { useUserListStore } from "../stores/useUserListStore"
import { ServerList } from "../components/layout/ServerList"
import { openUserSettingsModal } from "../utils/modals"
import { Avatar } from "../components/ui"
import { ChatArea } from "../components/chat/ChatArea"
import { useToast } from "../components/ui"
import { api } from "../lib/api"
import { NotificationBell } from "../components/features/NotificationInbox"
import { BeacoinWalletButton } from "../components/features/BeacoinWallet"
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

  const { show } = useToast()

  const handleDMClick = (channelId: string) => {
    setActiveChannel(channelId)
  }

  const handleFriendsClick = () => {
    setActiveChannel(null)
  }

  // Derive filtered friends lists
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
      case "online":
        return `Online — ${onlineFriends.length}`
      case "all":
        return `All Friends — ${allFriends.length}`
      case "pending":
        return `Pending — 0`
      case "blocked":
        return `Blocked — ${blockedFriendsList.length}`
      case "add":
        return "Add Friend"
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

  return (
    <div className={styles.container}>
      <ServerList />

      {/* Left Nav Island */}
      <div className={styles.leftNav}>
        <div className={styles.searchBar}>
          <button
            className={styles.searchInput}
            onClick={() => show("Find or start a conversation", "info")}
          >
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

          <button
            className={styles.navButton}
            onClick={() => show("Discover coming soon", "info")}
          >
            <Compass size={24} />
            <span>Discover</span>
          </button>

          <div className={styles.dmHeader}>
            <span>Direct Messages</span>
            <button
              className={styles.iconButton}
              onClick={() => show("Create DM (placeholder)", "info")}
            >
              <PlusCircle size={16} className={styles.addIcon} />
            </button>
          </div>

          <div className={styles.dmListScroll}>
            {channels.length === 0 ? (
              <div className={styles.emptyDMs}>
                <MessageSquare size={48} className={styles.icon} />
                <p className={styles.emptyText}>
                  Wumpus is lonely, and so are your DMs.
                  <br />
                  Start a new conversation or add a friend!
                </p>
                <button
                  className={styles.addDMButton}
                  onClick={() => show("New DM (placeholder)", "info")}
                >
                  Start a New DM
                </button>
              </div>
            ) : (
              channels.map((channel) => (
                <div
                  key={channel.id}
                  className={`${styles.dmItem} ${
                    activeChannel === channel.id ? styles.active : ""
                  }`}
                  onClick={() => handleDMClick(channel.id)}
                >
                  <Avatar
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${channel.participants[0]?.username}`}
                    status={channel.participants[0]?.status as any}
                    size="md"
                  />
                  <div className={styles.dmName}>
                    {channel.participants[0]?.username}
                  </div>
                  {channel.unreadCount > 0 && (
                    <div className={styles.unreadBadge}>{channel.unreadCount}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.userArea}>
          <div
            className={styles.userPanel}
            onClick={() => openUserSettingsModal()}
          >
            <Avatar
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${
                user?.username || "Guest"
              }`}
              status="online"
              size="sm"
            />
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.username || "Guest"}</div>
              <div className={styles.userStatus}>
                {(user as any)?.customStatus || "#0000"}
              </div>
            </div>
          </div>
          <div className={styles.userControls}>
            <button
              className={styles.userControlButton}
              title="Mute"
              onClick={() => show("Muted (placeholder)", "info")}
            >
              <Mic size={18} />
            </button>
            <button
              className={styles.userControlButton}
              title="Deafen"
              onClick={() => show("Deafened (placeholder)", "info")}
            >
              <Headphones size={18} />
            </button>
            <button
              className={styles.userControlButton}
              title="Settings"
              onClick={() => openUserSettingsModal()}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Island */}
      <div className={styles.mainContent}>
        {!activeChannel ? (
          <>
            <header className={styles.topBar}>
              <div className={styles.topBarLeft}>
                <Users size={24} className={styles.topBarIcon} />
                <h2 className={styles.topBarTitle}>Friends</h2>
                <div className={styles.divider} />
                <div className={styles.tabs}>
                  {(["online", "all", "pending", "blocked"] as FriendTab[]).map(
                    (tab) => (
                      <button
                        key={tab}
                        className={`${styles.tab} ${
                          currentTab === tab ? styles.tabActive : ""
                        }`}
                        onClick={() => setCurrentTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    )
                  )}
                  <button
                    className={`${styles.addFriendButton} ${
                      currentTab === "add" ? styles.tabActive : ""
                    }`}
                    onClick={() => setCurrentTab("add")}
                  >
                    Add Friend
                  </button>
                </div>
              </div>
              <div className={styles.userControls}>
                <button
                  className={styles.userControlButton}
                  title="New DM"
                  onClick={() => show("New DM (placeholder)", "info")}
                >
                  <MessageSquare size={20} />
                </button>
                <div className={styles.divider} />
                <BeacoinWalletButton />
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
                /* Add Friend Form */
                <div
                  style={{
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        color: "var(--text-primary)",
                        fontSize: 20,
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                    >
                      Add Friend
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                      You can add friends with their Beacon username.
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      background: "var(--bg-secondary)",
                      borderRadius: "var(--radius-lg)",
                      padding: "4px 4px 4px 16px",
                      border: "1px solid var(--glass-border)",
                    }}
                  >
                    <input
                      type="text"
                      value={addFriendInput}
                      onChange={(e) => setAddFriendInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
                      placeholder="Enter a username…"
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "var(--text-primary)",
                        fontSize: 15,
                      }}
                    />
                    <button
                      onClick={handleAddFriend}
                      disabled={addFriendLoading || !addFriendInput.trim()}
                      style={{
                        padding: "10px 20px",
                        background: "var(--beacon-brand)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        cursor:
                          addFriendLoading || !addFriendInput.trim()
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          addFriendLoading || !addFriendInput.trim() ? 0.6 : 1,
                        fontSize: 14,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <UserPlus size={16} />
                      {addFriendLoading ? "Sending…" : "Send Request"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.searchBarTop}>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Search
                        size={16}
                        style={{
                          position: "absolute",
                          left: 12,
                          color: "var(--text-muted)",
                          pointerEvents: "none",
                        }}
                      />
                      <input
                        className={styles.searchInputTop}
                        placeholder="Search"
                        value={friendSearch}
                        onChange={(e) => setFriendSearch(e.target.value)}
                        style={{ paddingLeft: 36 }}
                      />
                    </div>
                  </div>

                  <div className={styles.friendsList}>
                    <div className={styles.friendsHeader}>{tabLabel()}</div>

                    {displayedFriends.length === 0 ? (
                      <div className={styles.emptyFriends}>
                        <div className={styles.activeNowIcon}>
                          <Users size={64} />
                        </div>
                        <p>
                          {currentTab === "blocked"
                            ? "No blocked users."
                            : currentTab === "pending"
                            ? "No pending friend requests."
                            : "Wumpus is waiting for friends. You don't have to be though!"}
                        </p>
                      </div>
                    ) : (
                      displayedFriends.map((friend) => (
                        <div
                          key={friend.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "12px 16px",
                            borderRadius: "var(--radius-md)",
                            cursor: "pointer",
                            transition: "background var(--transition-normal)",
                          }}
                          onMouseEnter={(e) => {
                            ;(e.currentTarget as HTMLDivElement).style.background =
                              "var(--bg-secondary)"
                          }}
                          onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLDivElement).style.background =
                              "transparent"
                          }}
                          onClick={() =>
                            show(`DM with ${friend.username} (coming soon)`, "info")
                          }
                        >
                          <Avatar
                            src={
                              friend.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`
                            }
                            status={friend.status as any}
                            size="md"
                          />
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                color: "var(--text-primary)",
                                fontWeight: 600,
                                fontSize: 15,
                              }}
                            >
                              {friend.username}
                            </div>
                            <div
                              style={{
                                color: getStatusColor(friend.status),
                                fontSize: 13,
                              }}
                            >
                              {getStatusLabel(friend.status)}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              show(
                                `Message ${friend.username} (coming soon)`,
                                "info"
                              )
                            }}
                            style={{
                              padding: "8px 14px",
                              background: "var(--bg-secondary)",
                              border: "1px solid var(--glass-border)",
                              borderRadius: "var(--radius-full)",
                              color: "var(--text-primary)",
                              fontSize: 13,
                              cursor: "pointer",
                            }}
                          >
                            Message
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className={styles.chatWrapper}>
            <ChatArea channelId={activeChannel} />
          </div>
        )}
      </div>

      {/* Right Panel Island */}
      <aside className={styles.rightPanel}>
        <h3 className={styles.activeNowTitle}>Active Now</h3>
        <div className={styles.activeNowContent}>
          {onlineFriends.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {onlineFriends.slice(0, 8).map((friend) => (
                <div
                  key={friend.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    transition: "background var(--transition-normal)",
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.background =
                      "var(--bg-secondary)"
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.background =
                      "transparent"
                  }}
                >
                  <Avatar
                    src={
                      friend.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`
                    }
                    status={friend.status as any}
                    size="sm"
                  />
                  <div>
                    <div
                      style={{
                        color: "var(--text-primary)",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {friend.username}
                    </div>
                    <div
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 12,
                      }}
                    >
                      {getStatusLabel(friend.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.activeNowEmpty}>
              <div className={styles.activeNowIcon}>
                <Compass size={48} />
              </div>
              <h4 className={styles.activeNowText}>It's quiet for now...</h4>
              <p className={styles.activeNowSubtext}>
                When a friend starts an activity, like playing a game or hanging
                out on voice, we'll show it here!
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
