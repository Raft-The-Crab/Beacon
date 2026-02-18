import { useState, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import styles from './Collapsible.module.css'

interface CollapsibleProps {
  title: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  icon?: ReactNode
  className?: string
}

export function Collapsible({ 
  title, 
  children, 
  defaultOpen = false, 
  icon,
  className 
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <button
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChevronDown size={18} className={styles.chevron} />
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.title}>{title}</span>
      </button>

      {isOpen && (
        <div className={styles.content}>
          {children}
        </div>
      )}
    </div>
  )
}
