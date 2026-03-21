import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { useToast } from '../components/ui'
import { Shield, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import styles from '../styles/modules/pages/Login.module.css'
import { motion } from 'framer-motion'

export function VerificationPage() {
  const navigate = useNavigate()
  const { 
    verificationRequired, 
    verificationEmail, 
    verifyEmail: authVerifyEmail, 
    resendVerification: authResendVerification,
    isAuthenticated
  } = useAuthStore()
  const { show: showToast } = useToast()

  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/channels/@me')
    } else if (!verificationRequired || !verificationEmail) {
      navigate('/login')
    }
  }, [verificationRequired, verificationEmail, isAuthenticated, navigate])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) {
      showToast('Please enter a valid 6-digit code', 'error')
      return
    }

    setVerifying(true)
    try {
      await authVerifyEmail(code)
      showToast('Account verified! Welcome to Beacon.', 'success')
      navigate('/channels/@me')
    } catch (error: any) {
      showToast(error.message || 'Verification failed', 'error')
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || resending) return
    
    setResending(true)
    try {
      await authResendVerification()
      showToast('A new code has been sent to your email.', 'success')
      setCountdown(60) // 1 minute cooldown
    } catch (error: any) {
      showToast(error.message || 'Failed to resend code', 'error')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className={`${styles.container} radiance`}>
      <div className={styles.artwork}>
        <div className={styles.shape1} />
        <div className={styles.shape2} />
        <div className={styles.shape3} />
      </div>

      <div className={styles.card}>
        <div className={styles.header}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={styles.logoIcon}
          >
            <Shield size={36} />
          </motion.div>
          <h1 className={styles.title}>Verify your account</h1>
          <p className={styles.subtitle}>
            Enter the 6-digit code we sent to <strong>{verificationEmail}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Verification Code"
            placeholder="000000"
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.currentTarget.value.replace(/\D/g, ''))}
            icon={<Shield size={18} />}
            required
            autoFocus
            disabled={verifying}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={verifying}
          >
            {verifying ? (
              <>
                <Loader2 size={18} className={styles.spinner} />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Shield size={18} />
                <span>Verify Account</span>
              </>
            )}
          </Button>

          <div className={styles.footer}>
            <p className={styles.toggleLink} style={{ marginBottom: '16px' }}>
              Didn't receive a code?
              <span 
                onClick={handleResend} 
                style={{ 
                  cursor: (resending || countdown > 0) ? 'not-allowed' : 'pointer', 
                  opacity: (resending || countdown > 0) ? 0.5 : 1,
                  pointerEvents: (resending || countdown > 0) ? 'none' : 'auto'
                }}
              >
                {resending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </span>
            </p>

            <button
              type="button"
              className={styles.backToLogin}
              onClick={() => {
                window.location.href = '/login'
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
