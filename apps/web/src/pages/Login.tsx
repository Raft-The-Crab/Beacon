import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { useToast } from '../components/ui'
import { Mail, Lock, User, Loader2, LogIn, UserPlus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import styles from './Login.module.css'

export function Login() {
  const navigate = useNavigate()
  const { setUser, isAuthenticated, login: authLogin, register: authRegister } = useAuthStore()
  const { show: showToast } = useToast()

  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')

  const continueAsGuest = () => {
    const guestUser = {
      id: `guest-${Date.now()}`,
      username: 'Guest User',
      discriminator: '0000',
      avatar: null,
      email: 'guest@local.beacon',
      status: 'online' as const,
      customStatus: 'Offline Mode',
    }

    setUser(guestUser as any)
    showToast('Entered offline mode (backend not required)', 'info')
    navigate('/channels/@me')
  }

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/channels/@me')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        await authLogin(email, password)
      } else {
        await authRegister(username, email, password)
      }
      showToast('Welcome to Beacon!', 'success')
      navigate('/channels/@me')
    } catch (error: any) {
      showToast(error.message || 'Authentication failed. Proceeding in offline mode.', 'warning')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Hyper-Fluid Holographic Background */}
      <div className={styles.artwork}>
        <div className={styles.shape1} />
        <div className={styles.shape2} />
        <div className={styles.shape3} />
      </div>

      <div className={`${styles.card} ${loading ? styles.cardLoading : ''}`}>
        <div className={styles.header}>
          <div className={styles.logoIcon}>B</div>
          <h1 className={styles.title}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p className={styles.subtitle}>
            {isLogin ? "We're so excited to see you again!" : "Join the world's most beautiful community."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <Input
              label="Username"
              placeholder="Choose a username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
              icon={<User size={18} />}
              required
            />
          )}

          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            icon={<Mail size={18} />}
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={<Lock size={18} />}
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className={styles.spinner} />
                <span>{isLogin ? 'Logging in...' : 'Signing up...'}</span>
              </>
            ) : (
              <>
                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                <span>{isLogin ? 'Log In' : 'Create Account'}</span>
              </>
            )}
          </Button>
        </form>

        <div className={styles.divider} />

        <div className={styles.footer}>
          <p className={styles.toggleLink}>
            {isLogin ? "Need an account?" : "Already have an account?"}
            <span onClick={() => {
              setIsLogin(!isLogin);
              // Small vibration/feedback logic could go here if native
            }}>
              {isLogin ? 'Sign Up' : 'Log In'}
            </span>
          </p>

          <button
            type="button"
            className={styles.guestBtn}
            onClick={continueAsGuest}
          >
            Continue in Offline Mode
          </button>
        </div>
      </div>
    </div>
  )
}
