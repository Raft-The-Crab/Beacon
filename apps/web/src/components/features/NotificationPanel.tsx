import { Bell, Check, X, Settings, MessageSquare, AtSign, Phone, UserPlus, Mail } from 'lucide-react'
import { Button } from '../ui'
import { useNotificationsStore, NotificationType } from '../../stores/useNotificationsStore'
import styles from './NotificationPanel.module.css'

interface NotificationPanelProps {
  onClose?: () => void
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  message: <MessageSquare size={20} />,
  mention: <AtSign size={20} />,
  call: <Phone size={20} />,
  friend_request: <UserPlus size={20} />,
  server_invite: <Mail size={20} />,
  info: <Bell size={20} />,
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } =
    useNotificationsStore()

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId)
  }

  const handleRemove = (notificationId: string) => {
    removeNotification(notificationId)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Bell size={20} />
          <h3 className={styles.title}>Notifications</h3>
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconButton} title="Notification Settings">
            <Settings size={18} />
          </button>
          {onClose && (
            <button className={styles.iconButton} onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {notifications.length > 0 && (
        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        </div>
      )}

      <div className={styles.notifications}>
        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell size={48} className={styles.emptyIcon} />
            <p className={styles.emptyText}>No notifications</p>
            <p className={styles.emptySubtext}>You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`${styles.notification} ${notification.read ? styles.read : styles.unread}`}
            >
              <div className={styles.iconContainer}>
                {notificationIcons[notification.type]}
              </div>
              <div className={styles.content}>
                <div className={styles.notificationHeader}>
                  <span className={styles.notificationTitle}>{notification.title}</span>
                  <span className={styles.timestamp}>
                    {getRelativeTime(notification.timestamp)}
                  </span>
                </div>
                <p className={styles.message}>{notification.message}</p>
              </div>
              <div className={styles.notificationActions}>
                {!notification.read && (
                  <button
                    className={styles.actionButton}
                    onClick={() => handleMarkAsRead(notification.id)}
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  className={styles.actionButton}
                  onClick={() => handleRemove(notification.id)}
                  title="Remove"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function getRelativeTime(timestamp: string): string {
  const now = new Date().getTime()
  const past = new Date(timestamp).getTime()
  const diffInSeconds = Math.floor((now - past) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return new Date(timestamp).toLocaleDateString()
}
