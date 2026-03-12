import { useState, useEffect } from 'react'
import { X, LogOut, User, Shield, Bell, Code, Lock, Settings, Users, Globe, Moon, Sun, Book, AlignLeft, Layers, Zap, Palette, ChevronDown, Gift } from 'lucide-react'
import { useUIStore } from '../../stores/useUIStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { useServerStore } from '../../stores/useServerStore'
import { useNavigate } from 'react-router-dom'
import { Button, Input, AvatarUpload, Switch, Avatar, Dropdown } from '../ui'
import { useToast } from '../ui'
import { apiClient } from '../../services/apiClient'
import { fileUploadService, type UploadedFile } from '../../services/fileUpload'
import { useProfileArtStore } from '../../stores/useProfileArtStore'
import { useTranslationStore } from '../../stores/useTranslationStore'
import { useLowBandwidthStore } from '../../stores/useLowBandwidthStore'
import { useQuestStore } from '../../stores/useQuestStore'
import { useBeacoinStore } from '../../stores/useBeacoinStore'
import { api } from '../../lib/api'
import styles from '../../styles/modules/modals/SettingsModal.module.css'

const PRESET_COLORS = [
    { name: 'Sapphire', color: '#7289da' },
    { name: 'Ruby', color: '#ff5d66' },
    { name: 'Emerald', color: '#23a559' },
    { name: 'Amber', color: '#f0b232' },
    { name: 'Amethyst', color: '#949cf7' },
    { name: 'Rose', color: '#eb459e' },
    { name: 'Gold', color: '#faa61a' },
]

const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
]

const DEFAULT_NOTIF_PREFS = {
    allMessages: true,
    friendRequests: true,
    serverInvites: true,
    desktopNotifications: typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted',
    mentions: true,
    sounds: true,
}

interface SettingsModalProps {
    isOpen?: boolean
    onClose?: () => void
}

import { ProfileArtPicker } from '../features/ProfileArtPicker'

type TabId = 'profile' | 'profileArt' | 'security' | 'notifications' | 'advanced' | 'server' | 'appearance' | 'tasks' | 'redeem' | 'about'

type RedeemReward =
    | { kind: 'coins'; amount: number; code: string }
    | { kind: 'beacon_plus'; months: number; code: string; expiresAt?: string }

export function SettingsModal({ isOpen: propIsOpen, onClose: propOnClose }: SettingsModalProps = {}) {
    const {
        showUserSettings, setShowUserSettings,
        developerMode, setDeveloperMode,
        theme, setTheme,
        messageDensity, setMessageDensity,
        customBackground, setCustomBackground,
        customAccentColor, setCustomAccentColor
    } = useUIStore()

    const { language, setLanguage } = useTranslationStore()
    const { enabled: lowBandwidth, toggle: toggleLowBandwidth } = useLowBandwidthStore()

    const isOpen = propIsOpen !== undefined ? propIsOpen : showUserSettings
    const onClose = propOnClose || (() => setShowUserSettings(false))
    const { user, setUser, logout } = useAuthStore()
    const navigate = useNavigate()
    const toast = useToast()

    const [activeTab, setActiveTab] = useState<TabId>('profile')
    const { currentServer } = useServerStore()
    const [loading, setLoading] = useState(false)
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
    const [username, setUsername] = useState(user?.username || '')
    const [bio, setBio] = useState(user?.bio || '')
    const [notifPrefs, setNotifPrefs] = useState(() => {
        try {
            const saved = localStorage.getItem('beacon_notif_prefs')
            return saved ? { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(saved) } : DEFAULT_NOTIF_PREFS
        } catch { return DEFAULT_NOTIF_PREFS }
    })
    const [redeemCode, setRedeemCode] = useState('')
    const [redeeming, setRedeeming] = useState(false)
    const [redeemReward, setRedeemReward] = useState<RedeemReward | null>(null)
    const [redeemRevealState, setRedeemRevealState] = useState<'idle' | 'opening' | 'opened'>('idle')
    const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null)
    const { quests, isLoading: questsLoading, fetchQuests, claimReward } = useQuestStore()
    const { fetchWallet } = useBeacoinStore()

    const setNotifPref = (key: keyof typeof DEFAULT_NOTIF_PREFS) => (val: boolean) => {
        if (key === 'desktopNotifications' && val && typeof window !== 'undefined' && 'Notification' in window) {
            Notification.requestPermission().then(permission => {
                const next = { ...notifPrefs, [key]: permission === 'granted' }
                setNotifPrefs(next)
                localStorage.setItem('beacon_notif_prefs', JSON.stringify(next))
            })
            return
        }
        const next = { ...notifPrefs, [key]: val }
        setNotifPrefs(next)
        localStorage.setItem('beacon_notif_prefs', JSON.stringify(next))
    }

    // Support ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const handleSaveProfile = async () => {
        setLoading(true)
        try {
            const response = await apiClient.updateUser({
                username,
                bio,
            })
            if (response.success && response.data) {
                setUser(response.data)
                toast.success('Profile updated successfully')
            } else {
                toast.error(response.error || 'Failed to update profile')
            }
        } catch (error) {
            toast.error('An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await apiClient.logout()
        logout()
        setShowUserSettings(false)
        navigate('/login')
        toast.success('Logged out successfully')
    }

    const handleAvatarUpload = async (file: UploadedFile) => {
        try {
            const response = await apiClient.updateUser({
                avatar: file.url,
            })
            if (response.success && response.data) {
                setUser(response.data)
                toast.success('Avatar updated successfully')
            } else {
                toast.error(response.error || 'Failed to update avatar')
            }
        } catch (error) {
            toast.error('An error occurred')
        }
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.profileSection}>
                            <AvatarUpload
                                currentAvatar={user?.avatar && !user.avatar.includes('dicebear') ? user.avatar : undefined}
                                onUpload={handleAvatarUpload}
                                size={96}
                                type="user"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <Input
                                label="Username"
                                value={username}
                                onChange={(e: any) => setUsername(e.target.value)}
                                placeholder="Your username"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <Input
                                label="Bio"
                                value={bio}
                                onChange={(e: any) => setBio(e.target.value)}
                                placeholder="Tell us about yourself"
                                multiline
                                rows={4}
                            />
                        </div>

                        <Button variant="primary" fullWidth onClick={handleSaveProfile} loading={loading}>
                            Save Changes
                        </Button>
                    </div>
                )

            case 'security':
                const handleUpdateEmail = async () => {
                    setSecurityLoading(true)
                    const res = await apiClient.updateEmail({ email: newEmail, password: oldPassword })
                    if (res.success) {
                        setUser({ ...user!, email: newEmail })
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
                    const res = await apiClient.verify2FA(twoFACode)
                    if (res.success) {
                        setUser({ ...user!, twoFactorEnabled: true })
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
                                <p className={styles.muted}>Keep your account secure with a strong password.</p>
                                {showPasswordForm && (
                                    <div className={styles.inlineForm}>
                                        <Input label="Current Password" type="password" value={oldPassword} onChange={(e: any) => setOldPassword(e.target.value)} />
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
                                    Change Password
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

            case 'notifications':
                return (
                    <div className={styles.tabContent}>
                        <p className={styles.muted} style={{ marginBottom: 16 }}>
                            Control what notifications Beacon sends you. Changes are saved automatically.
                        </p>
                        <div className={styles.notificationItem}>
                            <div>
                                <span>All Messages</span>
                                <p className={styles.muted}>Notify for every message in channels</p>
                            </div>
                            <Switch checked={notifPrefs.allMessages} onChange={setNotifPref('allMessages')} />
                        </div>
                        <div className={styles.notificationItem}>
                            <div>
                                <span>Mentions Only</span>
                                <p className={styles.muted}>Only notify when you're @mentioned</p>
                            </div>
                            <Switch checked={notifPrefs.mentions} onChange={setNotifPref('mentions')} />
                        </div>
                        <div className={styles.notificationItem}>
                            <div>
                                <span>Friend Requests</span>
                                <p className={styles.muted}>When someone sends you a friend request</p>
                            </div>
                            <Switch checked={notifPrefs.friendRequests} onChange={setNotifPref('friendRequests')} />
                        </div>
                        <div className={styles.notificationItem}>
                            <div>
                                <span>Server Invites</span>
                                <p className={styles.muted}>When someone invites you to a server</p>
                            </div>
                            <Switch checked={notifPrefs.serverInvites} onChange={setNotifPref('serverInvites')} />
                        </div>
                        <div className={styles.notificationItem}>
                            <div>
                                <span>Desktop Notifications</span>
                                <p className={styles.muted}>Show system popups (requires browser permission)</p>
                            </div>
                            <Switch checked={notifPrefs.desktopNotifications} onChange={setNotifPref('desktopNotifications')} />
                        </div>
                        <div className={styles.notificationItem}>
                            <div>
                                <span>Notification Sounds</span>
                                <p className={styles.muted}>Play a sound when you receive a notification</p>
                            </div>
                            <Switch checked={notifPrefs.sounds} onChange={setNotifPref('sounds')} />
                        </div>
                    </div>
                )

            case 'advanced':
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.settingItem}>
                            <div>
                                <h3>Developer Mode</h3>
                                <p className={styles.muted}>
                                    Enable developer features including bot creation and management
                                </p>
                            </div>
                            <Switch checked={developerMode} onChange={setDeveloperMode} />
                        </div>
                        {developerMode && (
                            <div className={styles.devInfo}>
                                <p>✓ Developer Mode Enabled</p>
                                <Button onClick={() => {
                                    navigate('/developer')
                                    onClose()
                                }}>
                                    Open Developer Portal
                                </Button>
                            </div>
                        )}
                    </div>
                )

            case 'server':
                if (!currentServer) {
                    return (
                        <div className={styles.tabContent}>
                            <div className={styles.noServer}>
                                <Settings size={48} className={styles.serverIcon} />
                                <h3>No Server Selected</h3>
                                <p>Please select a server to manage its settings</p>
                            </div>
                        </div>
                    )
                }

                return (
                    <div className={styles.tabContent}>
                        <div className={styles.serverInfo}>
                            <div className={styles.serverHeader}>
                                <div className={styles.serverIconContainer}>
                                    <Settings size={32} />
                                </div>
                                <div>
                                    <h3>{currentServer.name}</h3>
                                    <p className={styles.serverId}>Server ID: {currentServer.id}</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.section}>
                            <h4>Server Details</h4>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Owner</span>
                                <span className={styles.detailValue}>{currentServer.ownerId || 'Unknown'}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Created</span>
                                <span className={styles.detailValue}>{new Date(currentServer.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Member Count</span>
                                <span className={styles.detailValue}>{currentServer.memberCount || 0}</span>
                            </div>
                        </div>
                    </div>
                )

            case 'appearance':
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.appearanceSection}>
                            <h3>Theme</h3>
                            <p className={styles.muted} style={{ marginBottom: 12 }}>Choose your Beacon visual style</p>
                            <div className={styles.themeOptions}>
                                <Button
                                    variant={theme === 'classic' ? 'primary' : 'secondary'}
                                    onClick={() => setTheme('classic')}
                                    className={styles.themeButton}
                                >
                                    <Moon size={16} />
                                    Dark
                                </Button>
                                <Button
                                    variant={theme === 'light' ? 'primary' : 'secondary'}
                                    onClick={() => setTheme('light')}
                                    className={styles.themeButton}
                                >
                                    <Sun size={16} />
                                    Light
                                </Button>
                                <Button
                                    variant={theme === 'glass' ? 'primary' : 'secondary'}
                                    onClick={() => setTheme('glass')}
                                    className={styles.themeButton}
                                >
                                    <Globe size={16} />
                                    Glass
                                </Button>
                                <Button
                                    variant={theme === 'oled' ? 'primary' : 'secondary'}
                                    onClick={() => setTheme('oled')}
                                    className={styles.themeButton}
                                >
                                    <Moon size={16} />
                                    OLED
                                </Button>
                                <Button
                                    variant={theme === 'neon' ? 'primary' : 'secondary'}
                                    onClick={() => setTheme('neon')}
                                    className={styles.themeButton}
                                >
                                    <Zap size={16} />
                                    Neon
                                </Button>
                                <Button
                                    variant={theme === 'midnight' ? 'primary' : 'secondary'}
                                    onClick={() => setTheme('midnight')}
                                    className={styles.themeButton}
                                >
                                    <Layers size={16} />
                                    Midnight
                                </Button>
                            </div>
                        </div>

                        <div className={styles.appearanceSection}>
                            <h3>Language</h3>
                            <p className={styles.muted} style={{ marginBottom: 16 }}>Select your preferred language for the interface</p>
                            <div style={{ maxWidth: 300 }}>
                                <Dropdown
                                    trigger={
                                        <Button variant="secondary" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <span style={{ fontSize: 18 }}>{LANGUAGES.find(l => l.code === language)?.flag || '🇺🇸'}</span>
                                                <span style={{ fontWeight: 600 }}>{LANGUAGES.find(l => l.code === language)?.name || 'English'}</span>
                                            </div>
                                            <ChevronDown size={16} className="text-muted" />
                                        </Button>
                                    }
                                    items={LANGUAGES.map(lang => ({
                                        id: lang.code,
                                        label: (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 250 }}>
                                                <span style={{ fontSize: 18 }}>{lang.flag}</span>
                                                <span style={{ fontWeight: 500, flex: 1 }}>{lang.name}</span>
                                                {language === lang.code && <span className="text-brand" style={{ fontWeight: 800 }}>✓</span>}
                                            </div>
                                        ),
                                        onClick: () => setLanguage(lang.code as any)
                                    }))}
                                    align="left"
                                />
                            </div>
                        </div>

                        <div className={styles.appearanceSection}>
                            <div className={styles.perfHeader}>
                                <div className={styles.perfTitleGroup}>
                                    <h3>Performance Mode</h3>
                                    <span className={lowBandwidth ? styles.perfBadgeLow : styles.perfBadgePremium}>
                                        {lowBandwidth ? 'Optimized' : 'Visual Max'}
                                    </span>
                                </div>
                                <Switch checked={lowBandwidth} onChange={toggleLowBandwidth} />
                            </div>
                            <p className={styles.muted}>
                                Disables GPU-heavy effects like mesh gradients, glass blurs, and VFX animations to improve performance on low-end devices.
                            </p>
                        </div>

                        <div className={styles.appearanceSection}>
                            <h3>Message Density</h3>
                            <p className={styles.muted} style={{ marginBottom: 12 }}>Control how messages are spaced in chat</p>
                            <div className={styles.densityOptions}>
                                {([
                                    { key: 'cozy' as const, label: 'Cozy', icon: <AlignLeft size={16} />, desc: 'Standard spacing with full avatars' },
                                    { key: 'compact' as const, label: 'Compact', icon: <AlignLeft size={14} />, desc: 'Smaller avatars, tighter spacing' },
                                    { key: 'ultra-compact' as const, label: 'Ultra-Compact', icon: <AlignLeft size={12} />, desc: 'No avatars, pure text list' },
                                ] as const).map(opt => (
                                    <button
                                        key={opt.key}
                                        className={`${styles.densityOption} ${messageDensity === opt.key ? styles.densityActive : ''}`}
                                        onClick={() => setMessageDensity(opt.key)}
                                    >
                                        <span className={styles.densityIcon}>{opt.icon}</span>
                                        <div className={styles.densityText}>
                                            <span className={styles.densityLabel}>{opt.label}</span>
                                            <span className={styles.densityDesc}>{opt.desc}</span>
                                        </div>
                                        {messageDensity === opt.key && (
                                            <span className={styles.densityCheck}>✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.appearanceSection}>
                            <div className={styles.sectionHeader}>
                                <h3>Customization</h3>
                                <p className={styles.muted}>Personalize your Beacon experience</p>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.inputLabel}>App Background</label>
                                <div className={styles.backgroundControls}>
                                    <Input
                                        value={customBackground || ''}
                                        onChange={(e: any) => setCustomBackground(e.target.value || null)}
                                        placeholder="Enter image URL..."
                                        className={styles.bgInput}
                                    />
                                    <div className={styles.uploadBox}>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => document.getElementById('bg-upload-input')?.click()}
                                            loading={loading}
                                        >
                                            <Globe size={16} />
                                            Upload Image
                                        </Button>
                                        <input
                                            id="bg-upload-input"
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0]
                                                if (file) {
                                                    setLoading(true)
                                                    try {
                                                        const uploaded = await fileUploadService.uploadFile(file)
                                                        setCustomBackground(uploaded.url)
                                                        toast.success('Background uploaded')
                                                    } catch (err) {
                                                        toast.error('Upload failed')
                                                    } finally {
                                                        setLoading(false)
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                {customBackground && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className={styles.resetBtn}
                                        onClick={() => setCustomBackground(null)}
                                    >
                                        Remove Background
                                    </Button>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.inputLabel}>Accent Color</label>
                                <div className={styles.colorPresets}>
                                    {PRESET_COLORS.map((preset) => (
                                        <button
                                            key={preset.name}
                                            className={`${styles.colorSwatch} ${customAccentColor === preset.color ? styles.activeSwatch : ''}`}
                                            style={{ backgroundColor: preset.color }}
                                            onClick={() => setCustomAccentColor(preset.color)}
                                            title={preset.name}
                                        />
                                    ))}
                                    <div className={styles.customColorBox}>
                                        <input
                                            type="color"
                                            value={customAccentColor || '#7289da'}
                                            onChange={(e) => setCustomAccentColor(e.target.value)}
                                            className={styles.colorPicker}
                                        />
                                    </div>
                                </div>
                                <div className={styles.colorActions}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setCustomAccentColor(null)}
                                        disabled={!customAccentColor}
                                    >
                                        Reset to Default
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.appearanceSection}>
                            <h3>Animations</h3>
                            <div className={styles.settingItem}>
                                <div>
                                    <h4>Enable Animations</h4>
                                    <p className={styles.muted}>Smooth transitions and effects</p>
                                </div>
                                <Switch checked={true} onChange={() => { }} disabled />
                            </div>
                        </div>
                    </div>
                )

            case 'about':
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.aboutSection}>
                            <h3>Beacon</h3>
                            <p className={styles.version}>Version 1.0.0</p>
                            <p className={styles.description}>
                                Beacon is a free, cross-platform real-time communication platform built as a Discord alternative.
                            </p>

                            <div className={styles.links}>
                                <Button variant="secondary" size="sm" onClick={() => window.open('https://github.com/beacon/beacon', '_blank')}>
                                    <Code size={16} />
                                    GitHub
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => {
                                    navigate('/docs')
                                    onClose()
                                }}>
                                    <Book size={16} />
                                    Documentation
                                </Button>
                            </div>

                            <div className={styles.legalLinks}>
                                <button onClick={() => { navigate('/terms'); onClose(); }}>Terms of Service</button>
                                <div className={styles.dot} />
                                <button onClick={() => { navigate('/privacy'); onClose(); }}>Privacy Policy</button>
                            </div>
                        </div>
                    </div>
                )

            case 'tasks':
                return (
                    <div className={styles.tabContent}>
                        <p className={styles.muted} style={{ marginBottom: 16 }}>
                            Complete quests to earn Beacoins and unlock cosmetics faster.
                        </p>

                        {questsLoading && (
                            <div className={styles.questCard}>
                                <p className={styles.muted}>Loading tasks...</p>
                            </div>
                        )}

                        {!questsLoading && quests.length === 0 && (
                            <div className={styles.questCard}>
                                <h3>No active tasks</h3>
                                <p className={styles.muted}>New quests will appear soon.</p>
                            </div>
                        )}

                        {!questsLoading && quests.map((questItem) => {
                            const progress = Math.min(100, Math.round((questItem.progress / Math.max(1, questItem.quest.total)) * 100))
                            const canClaim = questItem.completed && !questItem.claimed
                            return (
                                <div className={styles.questCard} key={questItem.id}>
                                    <div className={styles.questHeader}>
                                        <h3>{questItem.quest.title}</h3>
                                        <span className={styles.questReward}>+{questItem.quest.reward} Beacoins</span>
                                    </div>
                                    <p className={styles.muted}>{questItem.quest.description}</p>
                                    <div className={styles.questProgressRow}>
                                        <span className={styles.muted}>{questItem.progress}/{questItem.quest.total}</span>
                                        <span className={styles.muted}>{progress}%</span>
                                    </div>
                                    <div className={styles.questProgressTrack}>
                                        <div className={styles.questProgressFill} style={{ width: `${progress}%` }} />
                                    </div>
                                    <div className={styles.questActions}>
                                        <Button
                                            variant={canClaim ? 'primary' : 'secondary'}
                                            size="sm"
                                            disabled={!canClaim || claimingQuestId === questItem.questId}
                                            loading={claimingQuestId === questItem.questId}
                                            onClick={async () => {
                                                try {
                                                    setClaimingQuestId(questItem.questId)
                                                    await claimReward(questItem.questId)
                                                    await fetchWallet()
                                                    toast.success('Task reward claimed')
                                                } catch {
                                                    toast.error('Could not claim task reward')
                                                } finally {
                                                    setClaimingQuestId(null)
                                                }
                                            }}
                                        >
                                            {questItem.claimed ? 'Claimed' : canClaim ? 'Claim Reward' : 'In Progress'}
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )

            case 'redeem':
                return (
                    <div className={styles.tabContent}>
                        <p className={styles.muted} style={{ marginBottom: 16 }}>
                            Redeem codes unlock rewards instantly. Some codes grant Beacoins, and special drops can unlock Beacon+.
                        </p>

                        <div className={styles.redeemCard}>
                            <Input
                                label="Redeem Code"
                                value={redeemCode}
                                onChange={(e: any) => setRedeemCode(e.target.value.toUpperCase())}
                                placeholder="Enter code (example: STARTER500)"
                            />
                            <div className={styles.formActions}>
                                <Button
                                    variant="primary"
                                    loading={redeeming}
                                    disabled={!redeemCode.trim()}
                                    onClick={async () => {
                                        try {
                                            setRedeeming(true)
                                            setRedeemRevealState('opening')
                                            setRedeemReward(null)
                                            const { data } = await api.post('/users/@me/beacoin/redeem', { code: redeemCode.trim() })
                                            await fetchWallet()
                                            setRedeemCode('')

                                            const nextReward: RedeemReward = data?.reward?.kind === 'beacon_plus'
                                                ? {
                                                    kind: 'beacon_plus',
                                                    code: data.code,
                                                    months: Number(data?.reward?.months || 1),
                                                    expiresAt: data?.reward?.expiresAt,
                                                }
                                                : {
                                                    kind: 'coins',
                                                    code: data.code,
                                                    amount: Number(data?.amount || data?.reward?.amount || 0),
                                                }

                                            window.setTimeout(() => {
                                                setRedeemReward(nextReward)
                                                setRedeemRevealState('opened')
                                            }, 850)

                                            if (nextReward.kind === 'beacon_plus') {
                                                toast.success(`Redeemed ${nextReward.code} (Beacon+ for ${nextReward.months} month${nextReward.months === 1 ? '' : 's'})`)
                                            } else {
                                                toast.success(`Redeemed ${nextReward.code} (+${nextReward.amount} Beacoins)`)
                                            }
                                        } catch (err: any) {
                                            setRedeemRevealState('idle')
                                            const message = err?.response?.data?.error || 'Invalid or already redeemed code'
                                            toast.error(message)
                                        } finally {
                                            setRedeeming(false)
                                        }
                                    }}
                                >
                                    Redeem Code
                                </Button>
                            </div>
                            <p className={styles.muted}>Redeem codes are provided through events, rewards, and official drops.</p>

                            {(redeemRevealState !== 'idle' || redeemReward) && (
                                <div className={`${styles.redeemReveal} ${redeemRevealState === 'opening' ? styles.redeemRevealOpening : ''} ${redeemRevealState === 'opened' ? styles.redeemRevealOpened : ''}`}>
                                    <div className={styles.redeemCrate} aria-hidden>
                                        <div className={styles.redeemCrateLid} />
                                        <div className={styles.redeemCrateBody} />
                                        <div className={styles.redeemGlow} />
                                    </div>
                                    <div className={styles.redeemRewardText}>
                                        {redeemRevealState === 'opening' && <span>Opening reward crate...</span>}
                                        {redeemRevealState === 'opened' && redeemReward?.kind === 'coins' && (
                                            <span>+{redeemReward.amount} Beacoins from <strong>{redeemReward.code}</strong></span>
                                        )}
                                        {redeemRevealState === 'opened' && redeemReward?.kind === 'beacon_plus' && (
                                            <span>
                                                Beacon+ unlocked for {redeemReward.months} month{redeemReward.months === 1 ? '' : 's'} via <strong>{redeemReward.code}</strong>
                                                {redeemReward.expiresAt ? ` (expires ${new Date(redeemReward.expiresAt).toLocaleDateString()})` : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )

            case 'profileArt':
                return (
                    <div className={styles.tabContent}>
                        <p className={styles.muted} style={{ marginBottom: 24 }}>
                            Customize your profile with unique frames, banners, and effects. Your first 4 arts are free — earn Beacoins to unlock more!
                        </p>
                        <ProfileArtPicker />
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.sidebar}>
                    <div className={styles.userProfile}>
                        <div className={styles.avatar}>
                            <Avatar
                                src={user?.avatar && !user.avatar.includes('dicebear') ? user.avatar : undefined}
                                username={user?.username}
                                size="md"
                                frameUrl={(() => { const art = useProfileArtStore.getState().arts.find(a => a.id === useProfileArtStore.getState().equippedFrame); return art?.imageUrl; })()}
                                frameGradient={(() => { const art = useProfileArtStore.getState().arts.find(a => a.id === useProfileArtStore.getState().equippedFrame); return !art?.imageUrl ? art?.preview : undefined; })()}
                            />
                        </div>
                        <div className={styles.userInfo}>
                            <h3>{user?.username}</h3>
                            <span>#{user?.discriminator || '0000'}</span>
                        </div>
                    </div>

                    <nav className={styles.nav}>
                        <div className={styles.section}>
                            <span className={styles.sectionTitle}>User Settings</span>
                            <button
                                className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
                                onClick={() => setActiveTab('profile')}
                            >
                                <User size={18} />
                                Profile
                            </button>
                            <button
                                className={`${styles.navItem} ${activeTab === 'security' ? styles.active : ''}`}
                                onClick={() => setActiveTab('security')}
                            >
                                <Shield size={18} />
                                Security
                            </button>
                            <button
                                className={`${styles.navItem} ${activeTab === 'profileArt' ? styles.active : ''}`}
                                onClick={() => setActiveTab('profileArt')}
                            >
                                <Palette size={18} />
                                Profile Art
                            </button>
                        </div>

                        <div className={styles.section}>
                            <span className={styles.sectionTitle}>App Settings</span>
                            <button
                                className={`${styles.navItem} ${activeTab === 'notifications' ? styles.active : ''}`}
                                onClick={() => setActiveTab('notifications')}
                            >
                                <Bell size={18} />
                                Notifications
                            </button>
                            <button
                                className={`${styles.navItem} ${activeTab === 'appearance' ? styles.active : ''}`}
                                onClick={() => setActiveTab('appearance')}
                            >
                                <Settings size={18} />
                                Appearance
                            </button>
                            <button
                                className={`${styles.navItem} ${activeTab === 'advanced' ? styles.active : ''}`}
                                onClick={() => setActiveTab('advanced')}
                            >
                                <Code size={18} />
                                Advanced
                            </button>
                            <button
                                className={`${styles.navItem} ${activeTab === 'tasks' ? styles.active : ''}`}
                                onClick={async () => {
                                    setActiveTab('tasks')
                                    await fetchQuests()
                                }}
                            >
                                <Book size={18} />
                                Tasks
                            </button>
                            <button
                                className={`${styles.navItem} ${activeTab === 'redeem' ? styles.active : ''}`}
                                onClick={() => setActiveTab('redeem')}
                            >
                                <Gift size={18} />
                                Redeem Code
                            </button>
                        </div>

                        <div className={styles.section}>
                            <span className={styles.sectionTitle}>Server Settings</span>
                            <button
                                className={`${styles.navItem} ${activeTab === 'server' ? styles.active : ''}`}
                                onClick={() => setActiveTab('server')}
                            >
                                <Users size={18} />
                                Server
                            </button>
                        </div>

                        <div className={styles.section}>
                            <span className={styles.sectionTitle}>About</span>
                            <button
                                className={`${styles.navItem} ${activeTab === 'about' ? styles.active : ''}`}
                                onClick={() => setActiveTab('about')}
                            >
                                <Code size={18} />
                                About
                            </button>
                        </div>

                        <div className={styles.divider} />

                        <button className={`${styles.navItem} ${styles.logout}`} onClick={handleLogout}>
                            <LogOut size={18} />
                            Log Out
                        </button>
                    </nav>
                </div>

                <div className={styles.content}>
                    <div className={styles.header}>
                        <h2>{{ profile: 'Profile', profileArt: 'Profile Art', security: 'Security', notifications: 'Notifications', appearance: 'Appearance', advanced: 'Advanced', tasks: 'Tasks', redeem: 'Redeem Code', server: 'Server', about: 'About' }[activeTab]}</h2>
                    </div>

                    {renderTabContent()}
                </div>

                <div className={styles.closeWrapper}>
                    <button className={styles.closeButton} onClick={onClose}>
                        <div className={styles.closeIconBox}>
                            <X size={24} />
                        </div>
                        <span className={styles.closeText}>ESC</span>
                    </button>
                </div>
            </div>
        </div >
    )
}
