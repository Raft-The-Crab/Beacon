import React from 'react'
import { Layout, MessageSquare, Bell, User } from 'lucide-react'
import { useUIStore } from '../../stores/useUIStore'
import { useNotificationStore } from '../../stores/useNotificationStore'
import { motion, AnimatePresence } from 'framer-motion'
import styles from '../../styles/modules/layout/MobileTabNavigation.module.css'

export function MobileTabNavigation() {
  const activeMobileTab = useUIStore(state => state.activeMobileTab)
  const setActiveMobileTab = useUIStore(state => state.setActiveMobileTab)
  const setShowMobileSidebar = useUIStore(state => state.setShowMobileSidebar)
  
  const unreadCount = useNotificationStore(state => state.unreadCount)

  const handleTabClick = (tab: 'servers' | 'messages' | 'notifications' | 'profile') => {
    setActiveMobileTab(tab)
    
    // If clicking servers, we might want to ensure the sidebar is accessible
    if (tab === 'servers') {
      setShowMobileSidebar(true)
    } else {
      setShowMobileSidebar(false)
    }
  }

  const tabs = [
    { id: 'servers', label: 'Servers', icon: Layout },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'notifications', label: 'Discovery', icon: Bell },
    { id: 'profile', label: 'You', icon: User },
  ] as const

  return (
    <nav className={`${styles.container} glass`}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeMobileTab === tab.id

        return (
          <button
            key={tab.id}
            className={`${styles.tabItem} ${isActive ? styles.activeTab : ''}`}
            onClick={() => handleTabClick(tab.id)}
            aria-label={tab.label}
          >
            <AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className={styles.indicator}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>
            
            <div className={styles.iconWrapper}>
              <Icon 
                className={styles.tabIcon} 
                strokeWidth={isActive ? 2.5 : 2}
                size={22}
              />
              {tab.id === 'notifications' && unreadCount > 0 && (
                <span className={styles.badge}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
