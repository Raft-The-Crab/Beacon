import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { useToast } from '../components/ui'
import { Mail, Lock, User, Loader2, LogIn, UserPlus, Shield } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { apiClient } from '../services/apiClient'
import { resolveAssetUrl } from '../config/endpoints'
import styles from '../styles/modules/pages/Login.module.css'
import { motion, AnimatePresence } from 'framer-motion'
import { auth, googleProvider } from '../lib/firebase'
import { signInWithPopup } from 'firebase/auth'

export function Login() {
  const navigate = useNavigate()
  const { setUser, isAuthenticated, login: authLogin, socialLogin: authSocialLogin, register: authRegister, mfaRequired, verifyMFA: authVerifyMFA } = useAuthStore()
  const { show: showToast } = useToast()

  const [isLogin, setIsLogin] = useState(true)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [profilePreview, setProfilePreview] = useState<{ avatar: string | null; username: string } | null>(null)


  useEffect(() => {
    if (isAuthenticated) {
      navigate('/channels/@me')
    }
  }, [isAuthenticated, navigate])

  // Profile icon real-time fetch
  useEffect(() => {
    const identifier = isLogin ? email : username
    if (!identifier || identifier.length < 1) {
      setProfilePreview(null)
      return
    }

    const timer = setTimeout(async () => {
      const trimmedIdentifier = identifier.trim()
      if (trimmedIdentifier.length < 1) return

      try {
        const res = await apiClient.request('GET', `/auth/profile-preview/${encodeURIComponent(trimmedIdentifier)}`)
        if (res.success && res.data) setProfilePreview(res.data)
        else setProfilePreview(null)
      } catch {
        setProfilePreview(null)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [email, username, isLogin])

  // Check for any pending redirect results (if popup fell back to redirect)
  useEffect(() => {
    import('firebase/auth').then(({ getRedirectResult }) => {
      getRedirectResult(auth).then(async (result) => {
        if (result) {
          const idToken = await result.user.getIdToken()
          await authSocialLogin(idToken)
          showToast('Welcome back with Google!', 'success')
          navigate('/channels/@me')
        }
      }).catch((error) => {
        if (error.code === 'auth/missing-initial-state') {
          showToast('Google login failed: Please open in a standard browser (Safari/Chrome).', 'error')
        } else if (error.code !== 'auth/popup-closed-by-user') {
          showToast(error.message || 'Google login failed', 'error')
        }
      })
    })
  }, [authSocialLogin, navigate, showToast])

  const handleGoogleLogin = async () => {
    const isAppBrowser = /FBAN|FBAV|Messenger|Instagram|LinkedIn|Snapchat|TikTok/i.test(navigator.userAgent)
    if (isAppBrowser) {
      showToast('To use Google Login, please tap the three dots and select "Open in System Browser".', 'error')
      return
    }

    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      await authSocialLogin(idToken)
      showToast('Welcome back with Google!', 'success')
      navigate('/channels/@me')
    } catch (error: any) {
      if (error.code === 'auth/missing-initial-state') {
        showToast('Google login failed: Please open in a standard browser (Safari/Chrome).', 'error')
      } else if (error.code !== 'auth/popup-closed-by-user') {
        showToast(error.message || 'Google login failed', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await apiClient.request('POST', '/auth/forgot-password', { email });
      if (res.success) {
        showToast('If an account exists with that email, a reset link has been sent.', 'success');
        setIsForgotPassword(false);
      } else {
        throw new Error(res.error?.message || 'Failed to send reset link');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to send reset link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (isForgotPassword) {
      return handleForgotPassword(e);
    }
    e.preventDefault();

    if (mfaRequired) {
      setLoading(true);
      try {
        await authVerifyMFA(mfaCode);
        showToast('Successfully verified!', 'success');
        navigate('/channels/@me');
      } catch (error: any) {
        showToast(error.message || 'Verification failed', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

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
      showToast(error.message || 'Authentication failed. Please check your credentials.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${styles.container} radiance`}>
      {/* Hyper-Fluid Holographic Background */}
      <div className={styles.artwork}>
        <div className={styles.shape1} />
        <div className={styles.shape2} />
        <div className={styles.shape3} />
      </div>

      <div className={`${styles.card} ${loading ? styles.cardLoading : ''}`}>
        <div className={styles.header}>
          <AnimatePresence mode="wait">
            {profilePreview?.avatar ? (
              <motion.div 
                key="avatar"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={styles.avatarPreview}
              >
                <img src={resolveAssetUrl(profilePreview.avatar)} alt="Profile" />
              </motion.div>
            ) : (
              <motion.div 
                key="logo"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={styles.logoIcon}
              >
                B
              </motion.div>
            )}
          </AnimatePresence>
          <h1 className={styles.title}>
            {mfaRequired ? 'Two-Factor Auth' : (isForgotPassword ? 'Reset Password' : (isLogin ? (profilePreview ? `Hello, ${profilePreview.username}` : 'Welcome back') : 'Create account'))}
          </h1>
          <p className={styles.subtitle}>
            {mfaRequired 
              ? 'Enter the 6-digit code from your authenticator app.' 
              : (isForgotPassword 
                ? 'Enter your email to receive a password reset link.'
                : (isLogin ? "We're so excited to see you again!" : "Join the world's most beautiful community."))
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, staggerChildren: 0.1 }}
            className={styles.formContent}
          >
          {mfaRequired ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Input
              label="Verification Code"
              placeholder="000000"
              type="text"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.currentTarget.value)}
              icon={<Shield size={18} />}
              required
              autoFocus
            />
            </motion.div>
          ) : (
            <>
              {!isLogin && !isForgotPassword && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Input
              label="Username"
              placeholder="Choose a username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
              icon={<User size={18} />}
              required
            />
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            icon={profilePreview?.avatar ? (
              <div className={styles.inputAvatar}>
                <img src={resolveAssetUrl(profilePreview.avatar)} alt="" />
              </div>
            ) : <Mail size={18} />}
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
          />
          </motion.div>

              {!isForgotPassword && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock size={18} />}
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  required
                />
                </motion.div>
              )}
            </>
          )}
          </motion.div>

          {isLogin && !isForgotPassword && !mfaRequired && (
            <div className={styles.forgotPassword}>
              <span onClick={() => setIsForgotPassword(true)}>
                Forgot your password?
              </span>
            </div>
          )}

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
                <span>{mfaRequired ? 'Verifying...' : (isForgotPassword ? 'Sending...' : (isLogin ? 'Logging in...' : 'Signing up...'))}</span>
              </>
            ) : (
              <>
                {mfaRequired ? <Shield size={18} /> : (isForgotPassword ? <Mail size={18} /> : (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />))}
                <span>{mfaRequired ? 'Verify Code' : (isForgotPassword ? 'Send Reset Link' : (isLogin ? 'Log In' : 'Create Account'))}</span>
              </>
            )}
          </Button>

          {(isForgotPassword || mfaRequired) && (
            <div className={styles.backToLogin} onClick={() => {
              setIsForgotPassword(false);
              // reset mfa state if needed, but store should handle it
              window.location.reload(); // Hard reset for safety on MFA cancel
            }}>
              Back to Login
            </div>
          )}

        {auth && googleProvider && (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              onClick={handleGoogleLogin}
              disabled={loading}
              className={styles.googleBtn}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </Button>
          )}
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
        </div>
      </div>
    </div>
  )
}
