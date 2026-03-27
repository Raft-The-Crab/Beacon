import React, { useState } from 'react'
import { Palette, Sparkles } from 'lucide-react'
import { useAuthStore } from '../../../stores/useAuthStore'
import { useProfileArtStore } from '../../../stores/useProfileArtStore'
import { Button } from '../../ui'
import { IdentityPreview } from '../../features/IdentityPreview'
import { ProfileArtPicker } from '../../features/ProfileArtPicker'
import { UsernameStyleEditor } from '../../features/UsernameStyleEditor'
import styles from '../../../styles/modules/modals/SettingsModal.module.css'

export const CustomizationTab: React.FC = () => {
    const { user } = useAuthStore()
    const { arts, equippedFrame } = useProfileArtStore()
    const activeFrame = arts.find(a => a.id === equippedFrame)
    const hasBeaconPlus = Boolean((user as any)?.isBeaconPlus)

    const [nameDesign, setNameDesign] = useState<any>((user as any)?.nameDesign || {
        font: 'default',
        glow: 'none',
        animation: 'none',
        color: '',
    })
    const [profileColor, setProfileColor] = useState<string>((user as any)?.profileColor || 'var(--beacon-brand)')
    const [pronouns, setPronouns] = useState<string>((user as any)?.pronouns || '')
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        try {
            await useAuthStore.getState().updateProfile({
                profileColor,
                pronouns,
                nameDesign
            } as any)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.customizationTab}>
            <div className={styles.customizationLayout}>
                <div className={styles.customizationPreview}>
                    <div className={styles.previewSticky}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span className={styles.previewLabel}>LIVE PREVIEW</span>
                            <span className={hasBeaconPlus ? styles.perfBadgePremium : styles.perfBadgeLow}>
                                {hasBeaconPlus ? 'Premium Identity' : 'Beacon+ Required'}
                            </span>
                        </div>
                        <IdentityPreview 
                            user={user}
                            nameDesign={nameDesign}
                            frameUrl={activeFrame?.imageUrl}
                            frameGradient={!activeFrame?.imageUrl ? activeFrame?.preview : undefined}
                            bannerUrl={(user as any)?.banner}
                            profileColor={profileColor}
                            pronouns={pronouns}
                            bio={user?.bio || undefined}
                        />
                    </div>
                </div>
                
                <div className={styles.customizationControls}>
                    <div className={styles.customizationSection}>
                        <header className={styles.sectionHeader}>
                            <Palette size={18} />
                            <h4>Profile Color</h4>
                        </header>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input 
                                type="color" 
                                value={profileColor} 
                                onChange={(e) => setProfileColor(e.target.value)}
                                style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }}
                            />
                            <input 
                                type="text" 
                                value={profileColor} 
                                onChange={(e) => setProfileColor(e.target.value)}
                                className={styles.input}
                                style={{ flex: 1, fontFamily: 'monospace' }}
                                placeholder="#HEX"
                            />
                        </div>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.customizationSection}>
                        <header className={styles.sectionHeader}>
                            <div className={styles.sectionTitleGroup}>
                                <h4>Profile Art</h4>
                                <span className={styles.premiumTag}>PREMIUM</span>
                            </div>
                        </header>
                        <ProfileArtPicker />
                    </div>
                    
                    <div className={styles.divider} />

                    <div className={styles.customizationSection}>
                        <header className={styles.sectionHeader}>
                            <div className={styles.sectionTitleGroup}>
                                <h4>Username Identity</h4>
                                <span className={styles.premiumTag}>PREMIUM</span>
                            </div>
                        </header>
                        <UsernameStyleEditor 
                            design={nameDesign} 
                            setDesign={setNameDesign} 
                        />
                    </div>

                    <div className={styles.saveSection}>
                        <Button 
                            variant="primary" 
                            onClick={handleSave} 
                            loading={loading}
                            fullWidth
                        >
                            Save Customization
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
