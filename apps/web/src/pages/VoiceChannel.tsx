import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { openVoiceChannelModal } from '../utils/modals'
import styles from './VoiceChannel.module.css'

export function VoiceChannel() {
  const navigate = useNavigate()

  useEffect(() => {
    // Open the voice channel modal overlay
    openVoiceChannelModal()
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎙️ Voice Channel</h1>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          gap: 16,
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ fontSize: 64, opacity: 0.3 }}>🎧</div>
        <p style={{ fontSize: 16, textAlign: 'center', maxWidth: 320 }}>
          Starting voice channel…
        </p>
        <button
          onClick={() => navigate('/channels/@me')}
          style={{
            marginTop: 8,
            padding: '10px 24px',
            background: 'var(--beacon-brand)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  )
}
