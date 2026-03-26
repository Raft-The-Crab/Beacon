import { useState, useRef, useEffect, ReactNode, KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
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
  matchTriggerWidth?: boolean
}

export function Dropdown({ trigger, items, align = 'right', className, matchTriggerWidth = false }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0, maxHeight: 320, minWidth: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }

      if (containerRef.current) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !menuRef.current || !triggerRef.current) return

    const updatePosition = () => {
      if (!menuRef.current || !triggerRef.current) return

      const menuRect = menuRef.current.getBoundingClientRect()
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const viewportPadding = 8
      const menuWidth = matchTriggerWidth ? Math.max(menuRect.width, triggerRect.width) : menuRect.width
      let x = align === 'right' ? triggerRect.right - menuWidth : triggerRect.left
      let y = triggerRect.bottom + 8

      if (x + menuWidth > window.innerWidth - viewportPadding) {
        x = window.innerWidth - menuWidth - viewportPadding
      }
      if (x < viewportPadding) x = viewportPadding

      const availableBelow = window.innerHeight - y - viewportPadding
      const availableAbove = triggerRect.top - viewportPadding
      const placeAbove = menuRect.height > availableBelow && availableAbove > availableBelow

      if (placeAbove) {
        const desiredHeight = Math.min(menuRect.height, 360)
        y = Math.max(viewportPadding, triggerRect.top - desiredHeight - 8)
      }

      const availableHeight = placeAbove ? availableAbove : availableBelow
      const maxHeight = Math.max(180, Math.min(360, availableHeight))

      setPosition({ x, y, maxHeight, minWidth: matchTriggerWidth ? triggerRect.width : 0 })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, align])

  const handleItemClick = (item: DropdownItem) => {
    item.onClick?.()
    setIsOpen(false)
  }

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsOpen((current) => !current)
    }

    if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const menu = (
    <div
      ref={menuRef}
      className={`${styles.menu} ${styles[align]}`}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        margin: 0,
        maxHeight: `${position.maxHeight}px`,
        minWidth: position.minWidth ? `${position.minWidth}px` : undefined,
      }}
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
  )

  return (
    <div ref={containerRef} className={`${styles.container} ${className || ''}`}>
      <div
        ref={triggerRef}
        className={styles.trigger}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {isOpen && typeof document !== 'undefined' ? createPortal(menu, document.body) : null}
    </div>
  )
}
