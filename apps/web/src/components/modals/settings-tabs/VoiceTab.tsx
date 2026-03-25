import React from 'react'
import { Volume2, Video } from 'lucide-react'
import { useVoiceStore } from '../../../stores/useVoiceStore'
import { useAuthStore } from '../../../stores/useAuthStore'
import { Button, SelectDropdown, Badge } from '../../ui'
import styles from '../../../styles/modules/modals/SettingsModal.module.css'

export const VoiceTab: React.FC = () => {
    const { videoQuality, setVideoQuality, frameRate, setFrameRate } = useVoiceStore()
    const { user } = useAuthStore()
    const isPremium = user?.isBeaconPlus

    return (
        <div className={styles.tabContent}>
            <div className={styles.appearanceSection}>
                <h3>Voice & Video</h3>
                <p className={styles.muted} style={{ marginBottom: 16 }}>Configure your streaming and call quality.</p>
                
                <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>
                        Video Quality 
                        {!isPremium && <Badge variant="beacon-plus" size="sm" style={{ marginLeft: 8 }}>PREMIUM ONLY</Badge>}
                    </label>
                    <SelectDropdown
                        options={[
                            { value: '720p', label: '720p (Standard)' },
                            { value: '1080p', label: `1080p (HD) ${!isPremium ? '💎' : ''}`, disabled: !isPremium },
                            { value: '1440p', label: `1440p (2K) ${!isPremium ? '💎' : ''}`, disabled: !isPremium },
                            { value: '4k', label: `4k (Ultra HD) ${!isPremium ? '💎' : ''}`, disabled: !isPremium },
                        ]}
                        value={videoQuality}
                        onChange={(val) => typeof val === 'string' && setVideoQuality(val as any)}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>Frame Rate</label>
                    <div className={styles.themeOptions}>
                        {[15, 30, 60].map(fps => {
                            const isLocked = fps === 60 && !isPremium;
                            return (
                                <Button 
                                    key={fps}
                                    variant={frameRate === fps ? 'primary' : 'secondary'}
                                    onClick={() => !isLocked && setFrameRate(fps as 15 | 30 | 60)}
                                    disabled={isLocked}
                                >
                                    {fps} FPS {isLocked && '💎'}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <div className={styles.securityItem}>
                <div className={styles.securityInfo}>
                    <h3>Input Device</h3>
                    <p className={styles.muted}>Default Communication Device</p>
                </div>
                <Button variant="secondary" size="sm">Configure</Button>
            </div>
        </div>
    )
}
