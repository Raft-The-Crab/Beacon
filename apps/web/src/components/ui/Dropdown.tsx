import { useState, useRef, useEffect, ReactNode } from 'react'
import styles from './Dropdown.module.css'

export interface DropdownItem {
  id: string
  label: ReactNode
  icon?: ReactNode
  onClick?: () => void
  variant?: 'default' | 'danger'
  divider?: boolean
}

interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  const handleItemClick = (item: DropdownItem) => {
    item.onClick?.()
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`${styles.container} ${className || ''}`}>
      <button 
        ref={triggerRef}
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        {trigger}
      </button>

      {isOpen && (
        <div className={`${styles.menu} ${styles[align]}`}>
          {items.map((item) => (
            <div key={item.id}>
              {item.divider ? (
                <div className={styles.divider} />
              ) : (
                <button
                  className={`${styles.item} ${styles[item.variant || 'default']}`}
                  onClick={() => handleItemClick(item)}
                >
                  {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
                  <span className={styles.itemLabel}>{item.label}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
