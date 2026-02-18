import { useEffect, useRef, useState, createContext, useContext, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styles from './ContextMenu.module.css'

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
export interface ContextMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  shortcut?: string
  danger?: boolean
  disabled?: boolean
  divider?: boolean // render a divider BEFORE this item
  onClick?: () => void
  submenu?: ContextMenuItem[]
}

interface ContextMenuState {
  x: number
  y: number
  items: ContextMenuItem[]
  visible: boolean
}

interface ContextMenuContextValue {
  open: (x: number, y: number, items: ContextMenuItem[]) => void
  close: () => void
}

// ────────────────────────────────────────────────────────────
// Context
// ────────────────────────────────────────────────────────────
const ContextMenuCtx = createContext<ContextMenuContextValue>({
  open: () => {},
  close: () => {},
})

export function useContextMenu() {
  return useContext(ContextMenuCtx)
}

// ────────────────────────────────────────────────────────────
// Provider (mount once near root)
// ────────────────────────────────────────────────────────────
export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ContextMenuState>({ x: 0, y: 0, items: [], visible: false })
  const menuRef = useRef<HTMLDivElement>(null)

  const open = useCallback((x: number, y: number, items: ContextMenuItem[]) => {
    setState({ x, y, items, visible: true })
  }, [])

  const close = useCallback(() => {
    setState(s => ({ ...s, visible: false }))
  }, [])

  // Adjust position so menu doesn't go off-screen
  const [adj, setAdj] = useState({ x: 0, y: 0 })
  useEffect(() => {
    if (!state.visible || !menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    let nx = state.x
    let ny = state.y
    if (nx + rect.width > window.innerWidth - 8) nx = window.innerWidth - rect.width - 8
    if (ny + rect.height > window.innerHeight - 8) ny = window.innerHeight - rect.height - 8
    if (nx < 8) nx = 8
    if (ny < 8) ny = 8
    setAdj({ x: nx, y: ny })
  }, [state.visible, state.x, state.y])

  // Close on click / scroll / ESC
  useEffect(() => {
    if (!state.visible) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close()
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('scroll', close, true)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('scroll', close, true)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [state.visible, close])

  return (
    <ContextMenuCtx.Provider value={{ open, close }}>
      {children}
      {state.visible && createPortal(
        <div
          ref={menuRef}
          className={styles.menu}
          style={{ left: adj.x || state.x, top: adj.y || state.y }}
          onContextMenu={e => e.preventDefault()}
        >
          {state.items.map((item) => (
            <MenuItemRow key={item.id} item={item} close={close} />
          ))}
        </div>,
        document.body
      )}
    </ContextMenuCtx.Provider>
  )
}

function MenuItemRow({ item, close }: { item: ContextMenuItem; close: () => void }) {
  const [subOpen, setSubOpen] = useState(false)

  if (item.divider) {
    return (
      <>
        <div className={styles.divider} />
        <button
          className={`${styles.item} ${item.danger ? styles.danger : ''} ${item.disabled ? styles.disabled : ''}`}
          onClick={() => {
            if (item.disabled) return
            item.onClick?.()
            close()
          }}
          disabled={item.disabled}
        >
          {item.icon && <span className={styles.icon}>{item.icon}</span>}
          <span className={styles.label}>{item.label}</span>
          {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
        </button>
      </>
    )
  }

  if (item.submenu) {
    return (
      <div
        className={styles.submenuWrapper}
        onMouseEnter={() => setSubOpen(true)}
        onMouseLeave={() => setSubOpen(false)}
      >
        <button className={`${styles.item} ${item.disabled ? styles.disabled : ''}`}>
          {item.icon && <span className={styles.icon}>{item.icon}</span>}
          <span className={styles.label}>{item.label}</span>
          <span className={styles.chevron}>›</span>
        </button>
        {subOpen && (
          <div className={styles.submenu}>
            {item.submenu.map(sub => (
              <MenuItemRow key={sub.id} item={sub} close={close} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      className={`${styles.item} ${item.danger ? styles.danger : ''} ${item.disabled ? styles.disabled : ''}`}
      onClick={() => {
        if (item.disabled) return
        item.onClick?.()
        close()
      }}
      disabled={item.disabled}
    >
      {item.icon && <span className={styles.icon}>{item.icon}</span>}
      <span className={styles.label}>{item.label}</span>
      {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
    </button>
  )
}

// ────────────────────────────────────────────────────────────
// Hook helper: onContextMenu handler factory
// ────────────────────────────────────────────────────────────
export function useContextMenuTrigger(items: ContextMenuItem[]) {
  const { open } = useContextMenu()
  return (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    open(e.clientX, e.clientY, items)
  }
}
