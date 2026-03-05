import React from 'react';
import { useLowBandwidthStore } from '../../stores/useLowBandwidthStore';
import styles from '../../styles/modules/ui/AuraOrbs.module.css';

export const AuraOrbs: React.FC = () => {
    const { enabled: lowBandwidth } = useLowBandwidthStore();

    // Don't render heavy VFX when the user has low-data mode enabled 
    // This saves CPU/GPU resources for Asia SIM card users
    if (lowBandwidth) return null;

    return (
        <div className={styles.container}>
            <div className="aura-orb aura-orb-primary" />
            <div className="aura-orb aura-orb-secondary" />
        </div>
    );
};
