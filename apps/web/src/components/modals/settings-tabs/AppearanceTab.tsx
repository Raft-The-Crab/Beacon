import React, { useState } from 'react'
import { Moon, Sun, Zap, Layers, AlignLeft, Globe } from 'lucide-react'
import { useUIStore } from '../../../stores/useUIStore'
import { useTranslationStore } from '../../../stores/useTranslationStore'
import { useLowBandwidthStore } from '../../../stores/useLowBandwidthStore'
import { useToast, Button, Input, Switch } from '../../ui'
import { SelectDropdown } from '../../ui/SelectDropdown'
import { fileUploadService } from '../../../services/fileUpload'
import styles from '../../../styles/modules/modals/SettingsModal.module.css'

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

export const AppearanceTab: React.FC = () => {
    const { 
        theme, setTheme, 
        glassEnabled, setGlassEnabled, 
        messageDensity, setMessageDensity,
        customBackground, setCustomBackground,
        customAccentColor, setCustomAccentColor
    } = useUIStore()
    const { language, setLanguage } = useTranslationStore()
    const { enabled: lowBandwidth, toggle: toggleLowBandwidth } = useLowBandwidthStore()
    const toast = useToast()
    const [loading, setLoading] = useState(false)

    return (
        <div className={styles.tabContent}>
            <div className={styles.appearanceSection}>
                <h3>Theme</h3>
                <p className={styles.muted} style={{ marginBottom: 12 }}>Choose your Beacon visual style</p>
                <div className={styles.themeOptions}>
                    <Button variant={theme === 'classic' ? 'primary' : 'secondary'} onClick={() => setTheme('classic')} className={styles.themeButton}>
                        <Moon size={16} /> Dark
                    </Button>
                    <Button variant={theme === 'light' ? 'primary' : 'secondary'} onClick={() => setTheme('light')} className={styles.themeButton}>
                        <Sun size={16} /> Light
                    </Button>
                    <Button variant={theme === 'oled' ? 'primary' : 'secondary'} onClick={() => setTheme('oled')} className={styles.themeButton}>
                        <Moon size={16} /> OLED
                    </Button>
                    <Button variant={theme === 'neon' ? 'primary' : 'secondary'} onClick={() => setTheme('neon')} className={styles.themeButton}>
                        <Zap size={16} /> Neon
                    </Button>
                    <Button variant={theme === 'dracula' ? 'primary' : 'secondary'} onClick={() => setTheme('dracula')} className={styles.themeButton}>
                        <Moon size={16} /> Dracula
                    </Button>
                    <Button variant={theme === 'midnight' ? 'primary' : 'secondary'} onClick={() => setTheme('midnight')} className={styles.themeButton}>
                        <Layers size={16} /> Midnight
                    </Button>
                </div>
            </div>

            <div className={styles.appearanceSection}>
                <div className={styles.perfHeader}>
                    <div className={styles.perfTitleGroup}>
                        <h3>Glassmorphism</h3>
                        <span className={glassEnabled ? styles.perfBadgeLow : styles.perfBadgePremium}>
                            {glassEnabled ? 'On' : 'Off'}
                        </span>
                    </div>
                    <Switch checked={glassEnabled} onChange={setGlassEnabled} />
                </div>
                <p className={styles.muted}>Applies a frosted-glass translucent effect to panels and surfaces.</p>
            </div>

            <div className={styles.appearanceSection}>
                <h3>Language</h3>
                <p className={styles.muted} style={{ marginBottom: 16 }}>Select your preferred language</p>
                <div className={styles.languageSelect}>
                    <SelectDropdown
                        options={LANGUAGES.map(lang => ({
                            value: lang.code,
                            label: lang.name,
                            icon: <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
                        }))}
                        value={language}
                        onChange={(value) => typeof value === 'string' && setLanguage(value)}
                        searchable
                        size="md"
                        placeholder="Select language"
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
                <p className={styles.muted}>Disables GPU-heavy effects to improve performance.</p>
            </div>

            <div className={styles.appearanceSection}>
                <h3>Message Density</h3>
                <div className={styles.densityOptions}>
                    {([
                        { key: 'cozy' as const, label: 'Cozy', icon: <AlignLeft size={16} />, desc: 'Standard spacing' },
                        { key: 'compact' as const, label: 'Compact', icon: <AlignLeft size={14} />, desc: 'Tighter spacing' },
                        { key: 'ultra-compact' as const, label: 'Ultra-Compact', icon: <AlignLeft size={12} />, desc: 'Pure text list' },
                    ] as const).map(opt => (
                        <button key={opt.key} className={`${styles.densityOption} ${messageDensity === opt.key ? styles.densityActive : ''}`} onClick={() => setMessageDensity(opt.key)}>
                            <span className={styles.densityIcon}>{opt.icon}</span>
                            <div className={styles.densityText}>
                                <span className={styles.densityLabel}>{opt.label}</span>
                                <span className={styles.densityDesc}>{opt.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.appearanceSection}>
                <h3>Customization</h3>
                <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>App Background</label>
                    <div className={styles.backgroundControls}>
                        <Input value={customBackground || ''} onChange={(e: any) => setCustomBackground(e.target.value || null)} placeholder="Image URL..." />
                        <Button variant="secondary" size="sm" onClick={() => document.getElementById('bg-upload-input')?.click()} loading={loading}>
                            <Globe size={16} /> Upload
                        </Button>
                        <input id="bg-upload-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                                setLoading(true)
                                try {
                                    const uploaded = await fileUploadService.uploadFile(file)
                                    setCustomBackground(uploaded.url)
                                    toast.success('Background uploaded')
                                } catch { toast.error('Upload failed') }
                                setLoading(false)
                            }
                        }} />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>Accent Color</label>
                    <div className={styles.colorPresets}>
                        {PRESET_COLORS.map((preset) => (
                            <button key={preset.name} className={`${styles.colorSwatch} ${customAccentColor === preset.color ? styles.activeSwatch : ''}`} style={{ backgroundColor: preset.color }} onClick={() => setCustomAccentColor(preset.color)} title={preset.name} />
                        ))}
                        <input type="color" value={customAccentColor || '#7289da'} onChange={(e) => setCustomAccentColor(e.target.value)} className={styles.colorPicker} />
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setCustomAccentColor(null)} disabled={!customAccentColor}>Reset</Button>
                </div>
            </div>
        </div>
    )
}
