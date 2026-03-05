import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { openUserProfileModal } from '../utils/modals'

export function UserProfile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (userId) {
      openUserProfileModal(userId)
    }
  }, [userId])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        gap: 16,
        color: 'var(--text-muted)',
      }}
    >
      <div style={{ fontSize: 56, opacity: 0.25 }}>👤</div>
      <p style={{ fontSize: 15, textAlign: 'center' }}>Loading profile…</p>
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: '10px 24px',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        ← Go Back
      </button>
    </div>
  )
}
