import { useState, useEffect } from 'react'
import { X, LogOut, User, Shield, Bell, Code, Lock, Settings, Users, Gift, Volume2, Palette, Book } from 'lucide-react'
import { useUIStore } from '../../stores/useUIStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { useServerStore } from '../../stores/useServerStore'
import { useQuestStore } from '../../stores/useQuestStore'
import { useProfileArtStore } from '../../stores/useProfileArtStore'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../ui'
import { apiClient } from '../../services/apiClient'
import styles from '../../styles/modules/modals/SettingsModal.module.css'

// Import tab components
import { ProfileTab } from './settings-tabs/ProfileTab'
import { CustomizationTab } from './settings-tabs/CustomizationTab'
import { SecurityTab } from './settings-tabs/SecurityTab'
import { NotificationsTab } from './settings-tabs/NotificationsTab'
import { VoiceTab } from './settings-tabs/VoiceTab'
import { AppearanceTab } from './settings-tabs/AppearanceTab'
import { AdvancedTab } from './settings-tabs/AdvancedTab'
import { ServerTab } from './settings-tabs/ServerTab'
import { TasksTab } from './settings-tabs/TasksTab'
import { RedeemTab } from './settings-tabs/RedeemTab'
import { AboutTab } from './settings-tabs/AboutTab'

interface SettingsModalProps {
    isOpen?: boolean
    onClose?: () => void
}

type TabId = 'profile' | 'customization' | 'security' | 'notifications' | 'voice' | 'advanced' | 'server' | 'appearance' | 'tasks' | 'redeem' | 'about'
const SETTINGS_INITIAL_TAB_KEY = 'beacon:settings_initial_tab'

function isTabId(value: string): value is TabId {
    return ['profile', 'customization', 'security', 'notifications', 'voice', 'advanced', 'server', 'appearance', 'tasks', 'redeem', 'about'].includes(value)
}

const TAB_META: Record<TabId, { title: string; eyebrow: string; description: string }> = {
    profile: { title: 'Profile Settings', eyebrow: 'Identity', description: 'Update your display identity, including username, avatar, and bio.' },
    customization: { title: 'Profile Customization', eyebrow: 'Visuals', description: 'Design your unique Beacon identity with custom frames and styles.' },
    security: { title: 'Security', eyebrow: 'Protection', description: 'Manage your email, password, and two-factor authentication.' },
    notifications: { title: 'Notifications', eyebrow: 'Alerts', description: 'Control how Beacon notifies you.' },
    advanced: { title: 'Advanced', eyebrow: 'Developer', description: 'Developer features and diagnostics.' },
    server: { title: 'Server', eyebrow: 'Workspace', description: 'View details for the currently active server.' },
    appearance: { title: 'Appearance', eyebrow: 'Interface', description: 'Themes and performance settings.' },
    tasks: { title: 'Tasks', eyebrow: 'Progression', description: 'Track quests and claim rewards.' },
    redeem: { title: 'Redeem Code', eyebrow: 'Rewards', description: 'Enter codes to unlock Beacoins or Beacon+.' },
    voice: { title: 'Voice & Video', eyebrow: 'Streaming', description: 'Configure your microphone and video settings.' },
    about: { title: 'About', eyebrow: 'Product', description: 'Version details and legal links.' },
}

const SETTINGS_NAV: Array<{ section: string; items: Array<{ id: TabId; label: string; icon: any }> }> = [
    { section: 'Account', items: [{ id: 'profile', label: 'My Account', icon: User }, { id: 'customization', label: 'Customization', icon: Palette }, { id: 'security', label: 'Security', icon: Shield }] },
    { section: 'App', items: [{ id: 'notifications', label: 'Notifications', icon: Bell }, { id: 'voice', label: 'Voice & Video', icon: Volume2 }, { id: 'appearance', label: 'Appearance', icon: Settings }, { id: 'advanced', label: 'Advanced', icon: Code }, { id: 'tasks', label: 'Tasks', icon: Book }, { id: 'redeem', label: 'Redeem Code', icon: Gift }] },
    { section: 'Server', items: [{ id: 'server', label: 'Server', icon: Users }] },
    { section: 'Info', items: [{ id: 'about', label: 'About', icon: Code }] },
]

export function SettingsModal({ isOpen: propIsOpen, onClose: propOnClose }: SettingsModalProps = {}) {
    const { showUserSettings, setShowUserSettings, theme } = useUIStore()
    const { user, logout } = useAuthStore()
    const { fetchQuests } = useQuestStore()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<TabId>('profile')

    const isOpen = propIsOpen !== undefined ? propIsOpen : showUserSettings
    const onClose = propOnClose || (() => setShowUserSettings(false))
    const hasBeaconPlus = Boolean((user as any)?.isBeaconPlus)
    const activeTabMeta = TAB_META[activeTab]

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose() }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : ''
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        try {
            const requested = localStorage.getItem(SETTINGS_INITIAL_TAB_KEY)
            if (requested && isTabId(requested)) setActiveTab(requested)
            localStorage.removeItem(SETTINGS_INITIAL_TAB_KEY)
        } catch { }
    }, [isOpen])

    if (!isOpen) return null

    const handleLogout = async () => {
        await apiClient.logout(); logout(); setShowUserSettings(false); navigate('/login')
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile': return <ProfileTab />
            case 'customization': return <CustomizationTab />
            case 'security': return <SecurityTab />
            case 'notifications': return <NotificationsTab />
            case 'voice': return <VoiceTab />
            case 'advanced': return <AdvancedTab onClose={onClose} />
            case 'server': return <ServerTab />
            case 'appearance': return <AppearanceTab />
            case 'tasks': return <TasksTab />
            case 'redeem': return <RedeemTab />
            case 'about': return <AboutTab onClose={onClose} />
            default: return null
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
                                frameUrl={(() => {
                                    const arts = useProfileArtStore.getState().arts;
                                    const equipped = useProfileArtStore.getState().equippedFrame;
                                    return arts.find(a => a.id === equipped)?.imageUrl;
                                })()}
                                frameGradient={(() => {
                                    const arts = useProfileArtStore.getState().arts;
                                    const equipped = useProfileArtStore.getState().equippedFrame;
                                    const art = arts.find(a => a.id === equipped);
                                    return !art?.imageUrl ? art?.preview : undefined;
                                })()}
                            />
                        </div>
                        <div className={styles.userInfo}>
                            <h3>{user?.username}</h3>
                            <span>#{user?.discriminator || '0000'}</span>
                        </div>
                    </div>

                    <nav className={styles.nav}>
                        {SETTINGS_NAV.map((group) => (
                            <div className={styles.section} key={group.section}>
                                <span className={styles.sectionTitle}>{group.section}</span>
                                {group.items.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <button
                                            key={item.id}
                                            className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
                                            onClick={async () => {
                                                setActiveTab(item.id)
                                                if (item.id === 'tasks') await fetchQuests()
                                            }}
                                        >
                                            <Icon size={18} />
                                            {item.label}
                                        </button>
                                    )
                                })}
                            </div>
                        ))}
                        <div className={styles.divider} />
                        <button className={`${styles.navItem} ${styles.logout}`} onClick={handleLogout}>
                            <LogOut size={18} /> Log Out
                        </button>
                    </nav>
                </div>

                <div className={styles.content}>
                    <div className={styles.header}>
                        <span className={styles.headerEyebrow}>{activeTabMeta.eyebrow}</span>
                        <div className={styles.headerMain}>
                            <div>
                                <h2>{activeTabMeta.title}</h2>
                            </div>
                            <div className={styles.headerChips}>
                                {activeTab === 'appearance' && <span className={styles.headerChip}>{theme}</span>}
                                {activeTab === 'customization' && <span className={styles.headerChip}>{hasBeaconPlus ? 'Premium Identity' : 'Beacon+ Required'}</span>}
                            </div>
                        </div>
                    </div>
                    {renderTabContent()}
                </div>

                <div className={styles.closeWrapper}>
                    <button className={styles.closeButton} onClick={onClose}>
                        <div className={styles.closeIconBox}><X size={24} /></div>
                        <span className={styles.closeText}>ESC</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

