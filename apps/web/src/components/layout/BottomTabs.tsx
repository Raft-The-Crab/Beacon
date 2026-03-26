import { MessageSquare, Users, Compass, User } from 'lucide-react'
import { useUIStore } from '../../stores/useUIStore'
import styles from '../../styles/modules/layout/BottomTabs.module.css'

export function BottomTabs() {
  const { activeMobileTab, setActiveMobileTab } = useUIStore()

  const tabs = [
    { id: 'servers', icon: Users, label: 'Servers' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'discover', icon: Compass, label: 'Discover' },
    { id: 'profile', icon: User, label: 'You' },
  ] as const

  return (
    <nav className={styles.container}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeMobileTab === tab.id

        return (
          <button
            key={tab.id}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => setActiveMobileTab(tab.id)}
          >
            <div className={styles.iconWrapper}>
              <Icon size={24} />
            </div>
            <span className={styles.label}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
