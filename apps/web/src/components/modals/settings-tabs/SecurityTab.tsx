import React, { useState } from 'react'
import { Lock } from 'lucide-react'
import { useAuthStore } from '../../../stores/useAuthStore'
import { useToast, Button, Input } from '../../ui'
import { apiClient } from '../../../services/apiClient'
import styles from '../../../styles/modules/modals/SettingsModal.module.css'

export const SecurityTab: React.FC = () => {
    const { user, setUser } = useAuthStore()
    const toast = useToast()
    const [securityLoading, setSecurityLoading] = useState(false)
    const [showEmailForm, setShowEmailForm] = useState(false)
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [show2FAForm, setShow2FAForm] = useState(false)
    const [twoFACode, setTwoFACode] = useState('')
    const [twoFASecret, setTwoFASecret] = useState<any>(null)
    const [newEmail, setNewEmail] = useState('')
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handleUpdateEmail = async () => {
        setSecurityLoading(true)
        const res = await apiClient.updateEmail({ email: newEmail, password: oldPassword })
        if (res.success) {
            setUser({ ...user!, email: newEmail } as any)
            setShowEmailForm(false)
            setNewEmail('')
            setOldPassword('')
            toast.success('Email updated successfully')
        } else {
            toast.error(res.error || 'Failed to update email')
        }
        setSecurityLoading(false)
    }

    const handleUpdatePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        setSecurityLoading(true)
        const res = await apiClient.updatePassword({ oldPassword, newPassword })
        if (res.success) {
            setShowPasswordForm(false)
            setOldPassword('')
            setNewPassword('')
            setConfirmPassword('')
            toast.success('Password updated successfully')
        } else {
            toast.error(res.error || 'Failed to update password')
        }
        setSecurityLoading(false)
    }

    const handleEnable2FA = async () => {
        setSecurityLoading(true)
        const res = await apiClient.enable2FA()
        if (res.success) {
            setTwoFASecret(res.data)
            setShow2FAForm(true)
        } else {
            toast.error(res.error || 'Failed to enable 2FA')
        }
        setSecurityLoading(false)
    }

    const handleVerify2FA = async () => {
        setSecurityLoading(true)
        const res = await apiClient.verify2FA(twoFACode, twoFASecret?.secret)
        if (res.success) {
            setUser({ ...user!, twoFactorEnabled: true } as any)
            setShow2FAForm(false)
            setTwoFASecret(null)
            setTwoFACode('')
            toast.success('2FA enabled successfully!')
        } else {
            toast.error(res.error || 'Invalid 2FA code')
        }
        setSecurityLoading(false)
    }

    return (
        <div className={styles.tabContent}>
            <div className={styles.securityItem}>
                <div className={styles.securityInfo}>
                    <h3>Email</h3>
                    <p className={styles.muted}>{user?.email}</p>
                    {showEmailForm && (
                        <div className={styles.inlineForm}>
                            <Input label="New Email" value={newEmail} onChange={(e: any) => setNewEmail(e.target.value)} placeholder="new@email.com" />
                            <Input label="Current Password" type="password" value={oldPassword} onChange={(e: any) => setOldPassword(e.target.value)} />
                            <div className={styles.formActions}>
                                <Button size="sm" onClick={handleUpdateEmail} loading={securityLoading}>Save</Button>
                                <Button size="sm" variant="secondary" onClick={() => setShowEmailForm(false)}>Cancel</Button>
                            </div>
                        </div>
                    )}
                </div>
                {!showEmailForm && <Button variant="secondary" size="sm" onClick={() => setShowEmailForm(true)}>Change Email</Button>}
            </div>
            <div className={styles.securityItem}>
                <div className={styles.securityInfo}>
                    <h3>Password</h3>
                    <p className={styles.muted}>
                        {(user as any)?.hasPassword 
                            ? 'Keep your account secure with a strong password.' 
                            : 'Account currently uses social login. Set a password to enable credential sign-in.'}
                    </p>
                    {showPasswordForm && (
                        <div className={styles.inlineForm}>
                            {(user as any)?.hasPassword && (
                                <Input label="Current Password" type="password" value={oldPassword} onChange={(e: any) => setOldPassword(e.target.value)} />
                            )}
                            <Input label="New Password" type="password" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} />
                            <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} />
                            <div className={styles.formActions}>
                                <Button size="sm" onClick={handleUpdatePassword} loading={securityLoading}>Save</Button>
                                <Button size="sm" variant="secondary" onClick={() => setShowPasswordForm(false)}>Cancel</Button>
                            </div>
                        </div>
                    )}
                </div>
                {!showPasswordForm && (
                    <Button variant="secondary" size="sm" onClick={() => setShowPasswordForm(true)}>
                        <Lock size={16} />
                        {(user as any)?.hasPassword ? 'Change Password' : 'Set Password'}
                    </Button>
                )}
            </div>

            <div className={styles.securityItem}>
                <div className={styles.securityInfo}>
                    <h3>Two-Factor Authentication</h3>
                    <p className={styles.muted}>{user?.twoFactorEnabled ? '2FA is currently enabled.' : 'Add an extra layer of security to your account.'}</p>
                    {show2FAForm && twoFASecret && (
                        <div className={styles.inlineForm}>
                            <div className={styles.qrPlaceholder}>
                                <img src={twoFASecret.qrCode} alt="2FA QR Code" />
                                <p className={styles.secretText}>Secret: <code>{twoFASecret.secret}</code></p>
                            </div>
                            <Input label="Verification Code" value={twoFACode} onChange={(e: any) => setTwoFACode(e.target.value)} placeholder="123456" />
                            <div className={styles.formActions}>
                                <Button size="sm" onClick={handleVerify2FA} loading={securityLoading}>Verify & Enable</Button>
                                <Button size="sm" variant="secondary" onClick={() => setShow2FAForm(false)}>Cancel</Button>
                            </div>
                        </div>
                    )}
                </div>
                {!show2FAForm && !user?.twoFactorEnabled && (
                    <Button variant="secondary" size="sm" onClick={handleEnable2FA}>Enable 2FA</Button>
                )}
            </div>
        </div>
    )
}
