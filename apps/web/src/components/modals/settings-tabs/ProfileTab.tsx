import React, { useState, useRef } from 'react'
import { ImageIcon, Trash2 } from 'lucide-react'
import { useAuthStore } from '../../../stores/useAuthStore'
import { useToast, Button, Input, AvatarUpload } from '../../ui'
import { apiClient } from '../../../services/apiClient'
import { fileUploadService, type UploadedFile } from '../../../services/fileUpload'
import styles from '../../../styles/modules/modals/SettingsModal.module.css'

export const ProfileTab: React.FC = () => {
    const { user, setUser } = useAuthStore()
    const hasBeaconPlus = Boolean((user as any)?.isBeaconPlus)
    const toast = useToast()
    const [loading, setLoading] = useState(false)
    const [username, setUsername] = useState(user?.username || '')
    const [displayName, setDisplayName] = useState((user as any)?.displayName || user?.username || '')
    const [bio, setBio] = useState(user?.bio || '')
    const [bannerUrl, setBannerUrl] = useState((user as any)?.banner || '')
    const [pronouns, setPronouns] = useState<string>((user as any)?.pronouns || '')
    const [profileColor, setProfileColor] = useState<string>((user as any)?.profileColor || '#5865f2')
    const bannerInputRef = useRef<HTMLInputElement>(null)

    const resolveBannerUrl = (b?: string | null) => {
        if (!b) return null
        if (b.startsWith('http') || b.startsWith('https') || b.startsWith('data:') || b.startsWith('/')) return b
        return `/art/banners/${b}.png`
    }

    const handleSaveProfile = async () => {
        setLoading(true)
        try {
            const response = await apiClient.updateUser({
                username,
                displayName,
                bio,
                pronouns,
                profileColor,
                ...(bannerUrl !== ((user as any)?.banner || '') ? { banner: bannerUrl || null } : {}),
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

    const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const uploaded = await fileUploadService.uploadFile(file)
            const response = await apiClient.updateUser({ banner: uploaded.url })
            if (response.success && response.data) {
                setUser(response.data)
                setBannerUrl(uploaded.url)
                toast.success('Banner updated')
            } else {
                toast.error(response.error || 'Failed to update banner')
            }
        } catch {
            toast.error('Upload failed')
        }
        if (bannerInputRef.current) bannerInputRef.current.value = ''
    }

    const handleBannerRemove = async () => {
        try {
            const response = await apiClient.updateUser({ banner: null })
            if (response.success && response.data) {
                setUser(response.data)
                setBannerUrl('')
                toast.success('Banner removed')
            }
        } catch {
            toast.error('Failed to remove banner')
        }
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

    return (
        <div className={styles.premiumTabContent}>
            {/* Integrated Profile Card */}
            <div className={styles.profileHeaderCard}>
                <div 
                    className={styles.headerBanner}
                    style={resolveBannerUrl(bannerUrl) ? { backgroundImage: `url(${resolveBannerUrl(bannerUrl)})` } : { background: profileColor }}
                >
                    <div className={styles.bannerActions}>
                        <button className={styles.bannerActionBtn} onClick={() => bannerInputRef.current?.click()}>
                            <ImageIcon size={16} />
                            Edit Banner
                        </button>
                        {bannerUrl && (
                            <button className={styles.bannerActionBtn} onClick={handleBannerRemove}>
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                    <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleBannerFileChange}
                    />
                </div>
                <div className={styles.headerAvatarWrap}>
                    <AvatarUpload
                        currentAvatar={user?.avatar && !user.avatar.includes('dicebear') ? user.avatar : undefined}
                        onUpload={handleAvatarUpload}
                        size={80}
                        type="user"
                    />
                </div>
            </div>

            <div className={styles.premiumFormGrid}>
                <div className={styles.formSection}>
                    <h4 className={styles.formSectionTitle}>Account Identity</h4>
                    <div className={styles.formGroup}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <label className={styles.inputLabel} style={{ marginBottom: 0 }}>Display Name</label>
                            {!hasBeaconPlus && <span className={styles.premiumBadge} style={{ fontSize: 10 }}>BEACON+</span>}
                        </div>
                        <Input
                            value={displayName}
                            onChange={(e: any) => setDisplayName(e.target.value)}
                            placeholder={hasBeaconPlus ? "How people see your name" : "Your current display name"}
                            disabled={!hasBeaconPlus}
                            autoComplete="off"
                        />
                        {!hasBeaconPlus && (
                            <p className={styles.muted} style={{ fontSize: 11, marginTop: 4 }}>
                                Custom display names are a Beacon+ exclusive feature.
                            </p>
                        )}
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
                            label="Pronouns"
                            value={pronouns}
                            onChange={(e: any) => setPronouns(e.target.value)}
                            placeholder="They/Them"
                        />
                    </div>
                </div>

                <div className={styles.formSection}>
                    <h4 className={styles.formSectionTitle}>About You</h4>
                    <div className={styles.formGroup}>
                        <Input
                            label="Bio"
                            value={bio}
                            onChange={(e: any) => setBio(e.target.value)}
                            placeholder="Tell us about yourself"
                            multiline
                            rows={6}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.bottomActions}>
                <Button variant="primary" fullWidth onClick={handleSaveProfile} loading={loading}>
                    Save Profile Changes
                </Button>
            </div>
        </div>
    )
}
