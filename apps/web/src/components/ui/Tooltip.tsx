import { useState, useRef, ReactNode, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from '../../styles/modules/ui/Tooltip.module.css'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export function Tooltip({ content, children, position = 'top', delay = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: -9999, left: -9999 })
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      
      let top = 0;
      let left = 0;

      if (position === 'top') {
        top = rect.top - 8;
        left = rect.left + rect.width / 2;
      } else if (position === 'bottom') {
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2;
      } else if (position === 'left') {
        top = rect.top + rect.height / 2;
        left = rect.left - 8;
      } else if (position === 'right') {
        top = rect.top + rect.height / 2;
        left = rect.right + 8;
      }

      setCoords({ top, left })
    }
  }

  const handleMouseEnter = () => {
    updatePosition()
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  useLayoutEffect(() => {
    if (isVisible) {
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      return () => {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
      }
    }
  }, [isVisible])

  const getTransform = () => {
    switch (position) {
      case 'top': return 'translate(-50%, -100%)';
      case 'bottom': return 'translate(-50%, 0)';
      case 'left': return 'translate(-100%, -50%)';
      case 'right': return 'translate(0, -50%)';
    }
  }

  return (
    <>
      <div 
        ref={triggerRef}
        className={styles.container}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div 
          className={`${styles.tooltip} ${styles.portalTooltip}`}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            margin: 0,
            transform: getTransform(),
            zIndex: 999999
          }}
        >
          {content}
          <div className={`${styles.arrow} ${styles['arrow_' + position]}`} />
        </div>,
        document.body
      )}
    </>
  )
}
