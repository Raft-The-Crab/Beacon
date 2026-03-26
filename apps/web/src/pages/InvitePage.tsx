import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Users, Crown, Shield, Loader2 } from 'lucide-react'
import { apiClient } from '../services/apiClient'
import { useServerStore } from '../stores/useServerStore'
import { useAuthStore } from '../stores/useAuthStore'

export function InvitePage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [guildInfo, setGuildInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const joinGuild = useServerStore(s => s.joinGuild)
  const fetchGuild = useServerStore(s => s.fetchGuild)
  const servers = useServerStore(s => s.servers)

  useEffect(() => {
    if (!code) return

    const fetchInviteInfo = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await apiClient.request('GET', `/guilds/invites/${encodeURIComponent(code)}`)
        if (res.success && res.data) {
          setGuildInfo(res.data)
          // Check if user is already a member
          const alreadyMember = servers.some(s => s.id === res.data?.guild?.id || s.id === res.data?.guildId)
          if (alreadyMember) setJoined(true)
        } else {
          setError(res.error || 'Invite not found or has expired.')
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load invite information.')
      } finally {
        setLoading(false)
      }
    }

    void fetchInviteInfo()
  }, [code, servers])

  const handleJoin = async () => {
    if (!code || joining) return
    if (!isAuthenticated) {
      navigate(`/login?redirect=/invite/${code}`)
      return
    }
    setJoining(true)
    setError(null)
    try {
      const res = await apiClient.joinByInvite(code)
      if (!res.success || !res.data?.id) {
        throw new Error(res.error || 'Failed to join server.')
      }
      const guildId = res.data?.id as string
      if (guildId) {
        await joinGuild(guildId)
        await fetchGuild(guildId)
        setJoined(true)
        setTimeout(() => navigate(`/channels/${guildId}`), 800)
      }
    } catch (err: any) {
      setError(err?.message || 'Could not join this server.')
    } finally {
      setJoining(false)
    }
  }

  const guild = guildInfo?.guild || guildInfo

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 'var(--radius-2xl)',
        padding: '40px',
        width: '100%',
        maxWidth: 420,
        textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--beacon-brand)' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading invite...</p>
          </div>
        ) : error && !guild ? (
          <div>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
            <h2 style={{ marginBottom: 8 }}>Invalid Invite</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{error}</p>
            <button
              onClick={() => navigate('/channels/@me')}
              style={{ padding: '10px 24px', background: 'var(--beacon-brand)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
            >
              Go home
            </button>
          </div>
        ) : (
          <div>
            {/* Server icon */}
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '20px',
              background: guild?.icon ? 'transparent' : 'linear-gradient(135deg, var(--beacon-brand), #949cf7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: 32,
              fontWeight: 700,
              color: '#fff',
              overflow: 'hidden',
            }}>
              {guild?.icon
                ? <img src={guild.icon} alt={guild?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (guild?.name?.charAt(0)?.toUpperCase() || '?')}
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              You've been invited to join
            </p>
            <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800 }}>{guild?.name || 'Unknown Server'}</h1>

            {/* Member count */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 28 }}>
              {guild?.members !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14 }}>
                  <Users size={15} />
                  <span>{typeof guild.members === 'number' ? guild.members : (guild._count?.members ?? guild.members?.length ?? '?')} members</span>
                </div>
              )}
              {guild?.boostLevel > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f47fff', fontSize: 14 }}>
                  <Crown size={15} />
                  <span>Level {guild.boostLevel} Boosted</span>
                </div>
              )}
              {guild?.verified && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#57f287', fontSize: 14 }}>
                  <Shield size={15} />
                  <span>Verified</span>
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: 'rgba(242,63,67,0.1)', border: '1px solid rgba(242,63,67,0.3)', borderRadius: 8, padding: '10px 14px', color: 'var(--status-error)', fontSize: 14, marginBottom: 16 }}>
                {error}
              </div>
            )}

            {joined ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ color: '#57f287', fontSize: 14, fontWeight: 600 }}>✓ You're in! Redirecting...</div>
                <button
                  onClick={() => navigate(`/channels/${guild?.id}`)}
                  style={{ padding: '10px 24px', background: 'var(--beacon-brand)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Open Server
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  style={{
                    padding: '12px 24px',
                    background: joining ? 'rgba(88,101,242,0.6)' : 'var(--beacon-brand)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: joining ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                >
                  {joining ? 'Joining...' : (isAuthenticated ? 'Accept Invite' : 'Log in to Join')}
                </button>
                <button
                  onClick={() => navigate(isAuthenticated ? '/channels/@me' : '/')}
                  style={{ padding: '10px 24px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {isAuthenticated ? 'Not now' : 'Go home'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
