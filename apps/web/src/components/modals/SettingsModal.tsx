import { useState, useEffect } from 'react'
import { X, LogOut, User, Shield, Bell, Code, Lock, Settings, Users, Globe, Moon, Sun, Book } from 'lucide-react'
import { useUIStore } from '../../stores/useUIStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { useServerStore } from '../../stores/useServerStore'
import { useNavigate } from 'react-router-dom'
import { Button, Input, AvatarUpload, Switch } from '../ui'
import { useToast } from '../ui'
import { apiClient } from '@beacon/api-client'
import { fileUploadService, type UploadedFile } from '../../services/fileUpload'
import styles from './SettingsModal.module.css'

const PRESET_COLORS = [
    { name: 'Sapphire', color: '#7289da' },
    { name: 'Ruby', color: '#ff5d66' },
    { name: 'Emerald', color: '#23a559' },
    { name: 'Amber', color: '#f0b232' },
    { name: 'Amethyst', color: '#949cf7' },
    { name: 'Rose', color: '#eb459e' },
    { name: 'Gold', color: '#faa61a' },
]

interface SettingsModalProps {
    isOpen?: boolean
    onClose?: () => void
}

type TabId = 'profile' | 'security' | 'notifications' | 'advanced' | 'server' | 'appearance' | 'about'

export function SettingsModal({ isOpen: propIsOpen, onClose: propOnClose }: SettingsModalProps = {}) {
    const {
        showUserSettings, setShowUserSettings,
        developerMode, setDeveloperMode,
        theme, setTheme,
        customBackground, setCustomBackground,
        customAccentColor, setCustomAccentColor
    } = useUIStore()

    const isOpen = propIsOpen !== undefined ? propIsOpen : showUserSettings
    const onClose = propOnClose || (() => setShowUserSettings(false))
    const { user, setUser, logout } = useAuthStore()
    const navigate = useNavigate()
    const toast = useToast()

    const [activeTab, setActiveTab] = useState<TabId>('profile')
    const { currentServer } = useServerStore()
    const [loading, setLoading] = useState(false)
    const [username, setUsername] = useState(user?.username || '')
    const [customStatus, setCustomStatus] = useState(user?.customStatus || '')
    const [bio, setBio] = useState(user?.bio || '')

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
                customStatus,
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
                                currentAvatar={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                                onUpload={handleAvatarUpload}
                                size={96}
                                type="user"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <Input
                                label="Username"
                                value={username}
                                onChange={(e) => setUsername(e.currentTarget.value)}
                                placeholder="Your username"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <Input
                                label="Custom Status"
                                value={customStatus}
                                onChange={(e) => setCustomStatus(e.currentTarget.value)}
                                placeholder="What's on your mind?"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <Input
                                label="Bio"
                                value={bio}
                                onChange={(e) => setBio(e.currentTarget.value)}
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
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.securityItem}>
                            <div>
                                <h3>Email</h3>
                                <p className={styles.muted}>{user?.email}</p>
                            </div>
                            <Button variant="secondary" size="sm">Change Email</Button>
                        </div>

                        <div className={styles.securityItem}>
                            <div>
                                <h3>Password</h3>
                                <p className={styles.muted}>Last changed never</p>
                            </div>
                            <Button variant="secondary" size="sm">
                                <Lock size={16} />
                                Change Password
                            </Button>
                        </div>

                        <div className={styles.securityItem}>
                            <div>
                                <h3>Two-Factor Authentication</h3>
                                <p className={styles.muted}>Not enabled</p>
                            </div>
                            <Button variant="secondary" size="sm">Enable 2FA</Button>
                        </div>
                    </div>
                )

            case 'notifications':
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.notificationItem}>
                            <span>All Messages</span>
                            <Switch checked={true} onChange={() => { }} />
                        </div>
                        <div className={styles.notificationItem}>
                            <span>Friend Requests</span>
                            <Switch checked={true} onChange={() => { }} />
                        </div>
                        <div className={styles.notificationItem}>
                            <span>Server Invites</span>
                            <Switch checked={true} onChange={() => { }} />
                        </div>
                        <div className={styles.notificationItem}>
                            <span>Desktop Notifications</span>
                            <Switch checked={true} onChange={() => { }} />
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
                            <div className={styles.themeOptions}>
                                <Button
                                    variant={theme === 'classic' ? 'primary' : 'secondary'}
                                    onClick={() => setTheme('classic')}
                                    className={styles.themeButton}
                                >
                                    <Moon size={16} />
                                    Dark (Soft)
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
                                    variant={theme === 'light' ? 'primary' : 'secondary'}
                                    onClick={() => setTheme('light')}
                                    className={styles.themeButton}
                                >
                                    <Sun size={16} />
                                    Light
                                </Button>
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
                                        onChange={(e) => setCustomBackground(e.currentTarget.value || null)}
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
                                <Button variant="secondary" size="sm" onClick={() => window.open('https://beacon.com/docs', '_blank')}>
                                    <Book size={16} />
                                    Documentation
                                </Button>
                            </div>
                        </div>
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
                            <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} alt={user?.username} />
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
                        <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
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
        </div>
    )
}
