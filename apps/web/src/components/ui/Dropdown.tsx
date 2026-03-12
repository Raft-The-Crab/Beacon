import { useState, useRef, useEffect, ReactNode } from 'react'
import styles from '../../styles/modules/ui/Dropdown.module.css'

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
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (isOpen && menuRef.current && triggerRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect()
      const triggerRect = triggerRef.current.getBoundingClientRect()
      let x = 0
      let y = triggerRect.bottom + 8

      if (align === 'right') {
        x = triggerRect.right - menuRect.width
      } else {
        x = triggerRect.left
      }

      // Adjust if off-screen
      if (x + menuRect.width > window.innerWidth - 8) {
        x = window.innerWidth - menuRect.width - 8
      }
      if (x < 8) x = 8
      if (y + menuRect.height > window.innerHeight - 8) {
        y = triggerRect.top - menuRect.height - 8
      }

      setPosition({ x, y })
    }
  }, [isOpen, align])

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
        <div 
          ref={menuRef}
          className={`${styles.menu} ${styles[align]}`}
          style={{ position: 'fixed', left: position.x, top: position.y, margin: 0 }}
        >
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
