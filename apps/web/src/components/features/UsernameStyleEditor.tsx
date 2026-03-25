import React, { useState } from 'react';
import { Sparkles, Palette, Type, Zap, Check, Play } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { apiClient } from '../../services/apiClient';
import { CustomUsername } from '../ui/CustomUsername';
import { useToast } from '../ui';
import styles from '../../styles/modules/features/UsernameStyleEditor.module.css';

const FONTS = [
    { id: 'default', name: 'Default', value: 'default', icon: Type },
    { id: 'monospace', name: 'Retro', value: 'monospace', icon: Zap },
    { id: 'serif', name: 'Serif', value: 'serif', icon: Palette },
    { id: 'cursive', name: 'Script', value: 'cursive', icon: Sparkles },
    { id: 'display', name: 'Cyber', value: 'display', icon: Zap },
];

const GLOWS = [
    { id: 'none', name: 'None', icon: Zap },
    { id: 'neon', name: 'Neon', icon: Sparkles },
    { id: 'ultra', name: 'Ultra', icon: Zap },
];

const ANIMATIONS = [
    { id: 'none', name: 'None', icon: Play },
    { id: 'rainbow', name: 'Rainbow', icon: Sparkles },
    { id: 'pulse', name: 'Pulse', icon: Zap },
    { id: 'shimmer', name: 'Glitch', icon: Zap },
];

interface UsernameStyleEditorProps {
    design: any
    setDesign: (design: any) => void
    onSave?: () => void
}

export const UsernameStyleEditor: React.FC<UsernameStyleEditorProps> = ({ design, setDesign, onSave }) => {
    const { user, updateProfile } = useAuthStore();
    const { show } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await (updateProfile as any)({ nameDesign: design });
            show('Username style updated!', 'success');
        } catch (err) {
            show('An error occurred', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.editor}>

            <div className={styles.controls}>
                {/* Font Selection */}
                <div className={styles.controlGroup}>
                    <div className={styles.groupHeader}>
                        <Type size={16} />
                        <span>Font Type</span>
                    </div>
                    <div className={styles.optionsGrid}>
                        {FONTS.map(f => (
                            <button
                                key={f.id}
                                className={`${styles.optionBtn} ${design.font === f.value ? styles.active : ''}`}
                                onClick={() => setDesign({ ...design, font: f.value })}
                            >
                                <f.icon size={14} style={{ marginRight: 8 }} />
                                {f.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Glow Effects */}
                <div className={styles.controlGroup}>
                    <div className={styles.groupHeader}>
                        <Zap size={16} />
                        <span>Glow Intensity</span>
                    </div>
                    <div className={styles.optionsGrid}>
                        {GLOWS.map(g => (
                            <button
                                key={g.id}
                                className={`${styles.optionBtn} ${design.glow === g.id ? styles.active : ''}`}
                                onClick={() => setDesign({ ...design, glow: g.id })}
                            >
                                <g.icon size={14} style={{ marginRight: 8 }} />
                                {g.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Animations */}
                <div className={styles.controlGroup}>
                    <div className={styles.groupHeader}>
                        <Sparkles size={16} />
                        <span>Animations</span>
                    </div>
                    <div className={styles.optionsGrid}>
                        {ANIMATIONS.map(a => (
                            <button
                                key={a.id}
                                className={`${styles.optionBtn} ${design.animation === a.id ? styles.active : ''}`}
                                onClick={() => setDesign({ ...design, animation: a.id })}
                            >
                                <a.icon size={14} style={{ marginRight: 8 }} />
                                {a.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color Picker */}
                <div className={styles.controlGroup}>
                    <div className={styles.groupHeader}>
                        <Palette size={16} />
                        <span>Custom Color</span>
                    </div>
                    <div className={styles.colorInputWrap}>
                        <input 
                            type="color" 
                            value={design.color || '#ffffff'} 
                            onChange={(e) => setDesign({ ...design, color: e.target.value })}
                            className={styles.colorPicker}
                        />
                        <input 
                            type="text" 
                            value={design.color || ''} 
                            placeholder="#HEX"
                            onChange={(e) => setDesign({ ...design, color: e.target.value })}
                            className={styles.hexInput}
                        />
                        <button 
                            className={styles.resetBtn}
                            onClick={() => setDesign({ ...design, color: undefined })}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <button 
                className={styles.saveBtn} 
                onClick={handleSave}
                disabled={isSaving}
                style={{ marginTop: 24 }}
            >
                {isSaving ? 'Saving...' : (
                    <>
                        <Check size={18} />
                        <span>Save Changes</span>
                    </>
                )}
            </button>
        </div>
    );
};
