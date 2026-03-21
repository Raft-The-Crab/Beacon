import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ImageLightboxProps {
  isOpen: boolean
  src: string
  alt?: string
  onClose: () => void
}

export function ImageLightbox({ isOpen, src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const content = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="lightboxOverlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div 
          style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 12, zIndex: 10000 }}
          onClick={(e) => e.stopPropagation()}
        >
          <a href={src} target="_blank" rel="noopener noreferrer" style={{ color: 'white', padding: 8, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex' }} title="Open original">
            <ExternalLink size={20} />
          </a>
          <button onClick={onClose} style={{ color: 'white', border: 'none', padding: 8, background: 'rgba(255,255,255,0.1)', cursor: 'pointer', borderRadius: '50%', display: 'flex' }} title="Close (Esc)">
            <X size={20} />
          </button>
        </div>

        <motion.img
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          src={src}
          alt={alt || 'Attachment'}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            objectFit: 'contain',
            borderRadius: 8,
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
          }}
        />
      </motion.div>
    </AnimatePresence>
  )

  const root = document.getElementById('root') || document.body
  return createPortal(content, root)
}
