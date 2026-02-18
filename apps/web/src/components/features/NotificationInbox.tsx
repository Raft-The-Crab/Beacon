import { useEffect, useRef } from 'react'
import { Bell, X, Check, CheckCheck, MessageCircle, UserPlus, AtSign, Heart, Info } from 'lucide-react'
import { useNotificationStore, NotificationType, Notification } from '../../stores/useNotificationStore'
import styles from './NotificationInbox.module.css'

function getNotifIcon(type: NotificationType) {
  switch (type) {
    case 'message': return <MessageCircle size={16} />
    case 'mention': return <AtSign size={16} />
    case 'friend_request': return <UserPlus size={16} />
    case 'friend_accept': return <UserPlus size={16} />
    case 'reaction': return <Heart size={16} />
    default: return <Info size={16} />
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function NotificationBell() {
  const { unreadCount, dropdownOpen, toggleDropdown, setDropdownOpen } = useNotificationStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen, setDropdownOpen])

  return (
    <div ref={ref} className={styles.bellWrap}>
      <button
        className={`${styles.bellBtn} ${dropdownOpen ? styles.active : ''}`}
        onClick={toggleDropdown}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>
      {dropdownOpen && <NotificationDropdown />}
    </div>
  )
}

function NotificationDropdown() {
  const { notifications, markRead, markAllRead, deleteNotification, clearAll, isLoading } = useNotificationStore()

  return (
    <div className={styles.dropdown}>
      <div className={styles.dropdownHeader}>
        <span className={styles.dropdownTitle}>Notifications</span>
        <div className={styles.dropdownActions}>
          {notifications.some((n) => !n.read) && (
            <button className={styles.actionBtn} onClick={markAllRead} title="Mark all read">
              <CheckCheck size={15} />
            </button>
          )}
          {notifications.length > 0 && (
            <button className={styles.actionBtn} onClick={clearAll} title="Clear all">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.list}>
        {isLoading && (
          <div className={styles.empty}>
            <div className={styles.spinner} />
          </div>
        )}
        {!isLoading && notifications.length === 0 && (
          <div className={styles.empty}>
            <Bell size={36} className={styles.emptyIcon} />
            <p>You're all caught up!</p>
            <span>No new notifications.</span>
          </div>
        )}
        {notifications.map((n) => (
          <NotifItem key={n.id} notif={n} onRead={markRead} onDelete={deleteNotification} />
        ))}
      </div>
    </div>
  )
}

function NotifItem({ notif, onRead, onDelete }: {
  notif: Notification
  onRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      className={`${styles.item} ${!notif.read ? styles.unread : ''}`}
      onClick={() => !notif.read && onRead(notif.id)}
    >
      <div className={`${styles.iconWrap} ${styles[notif.type]}`}>
        {notif.avatarUrl
          ? <img src={notif.avatarUrl} alt="" className={styles.avatar} />
          : getNotifIcon(notif.type)}
      </div>
      <div className={styles.itemContent}>
        <div className={styles.itemTitle}>{notif.title}</div>
        <div className={styles.itemBody}>{notif.body}</div>
        <div className={styles.itemTime}>{timeAgo(notif.createdAt)}</div>
      </div>
      <div className={styles.itemActions}>
        {!notif.read && (
          <button className={styles.readBtn} onClick={(e) => { e.stopPropagation(); onRead(notif.id) }} title="Mark read">
            <Check size={13} />
          </button>
        )}
        <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); onDelete(notif.id) }} title="Remove">
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
