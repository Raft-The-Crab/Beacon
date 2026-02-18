import { ReactNode, useState } from 'react'
import styles from './Tabs.module.css'

export interface TabItem {
  id: string
  label: ReactNode
  content: ReactNode
  icon?: ReactNode
}

interface TabsProps {
  items: TabItem[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  className?: string
}

export function Tabs({ items, defaultTab, onChange, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id)

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  const activeTabItem = items.find(item => item.id === activeTab)

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.tabList}>
        {items.map((item) => (
          <button
            key={item.id}
            className={`${styles.tab} ${activeTab === item.id ? styles.active : ''}`}
            onClick={() => handleTabClick(item.id)}
          >
            {item.icon && <span className={styles.icon}>{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </div>
      
      {activeTabItem && (
        <div className={styles.content}>
          {activeTabItem.content}
        </div>
      )}
    </div>
  )
}
