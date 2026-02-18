import React, { useEffect, useRef, useState } from 'react'
import styles from './Modal.module.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  disableBackdropClick?: boolean
  disableEscapeClose?: boolean
  className?: string
  noPadding?: boolean
  transparent?: boolean
  hideHeader?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  disableBackdropClick = false,
  disableEscapeClose = false,
  className = '',
  noPadding = false,
  transparent = false,
  hideHeader = false
}: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const focusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    if (mounted && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstFocusableElement = focusableElements[0] as HTMLElement

      if (firstFocusableElement) {
        firstFocusableElement.focus()
      }

      const handleFocus = (e: FocusEvent) => {
        if (!modalRef.current?.contains(e.target as Node)) {
          firstFocusableElement?.focus()
        }
      }

      modalRef.current.addEventListener('focusin', handleFocus)

      return () => {
        modalRef.current?.removeEventListener('focusin', handleFocus)
      }
    }
  }, [mounted])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape && !disableEscapeClose) {
      e.preventDefault()
      onClose()
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && !disableBackdropClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!mounted) return null

  return (
    <div
      className={styles.overlay}
      onClick={handleBackdropClick}
      ref={focusRef}
    >
      <div
        className={`${styles.modal} ${styles[size]} ${transparent ? styles.transparent : ''} ${className}`}
        ref={modalRef}
      >
        {!hideHeader && title && (
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        )}
        <div className={`${styles.content} ${noPadding ? styles.noPadding : ''}`}>
          {children}
        </div>
      </div>
    </div>
  )
}