import React, { useMemo } from 'react';
import styles from '../../styles/modules/ui/CustomUsername.module.css';

interface NameDesign {
    font?: string;
    color?: string;
    glow?: 'none' | 'neon' | 'ultra';
    animation?: 'none' | 'rainbow' | 'pulse' | 'shimmer';
    gradient?: string[];
}

interface CustomUsernameProps {
    username: string;
    design?: NameDesign | null;
    baseColor?: string; // e.g. from highest role
    className?: string;
    onClick?: () => void;
}

export const CustomUsername: React.FC<CustomUsernameProps> = ({
    username,
    design,
    baseColor,
    className = '',
    onClick
}) => {
    const finalStyle = useMemo(() => {
        const s: React.CSSProperties = {};
        
        if (design?.color) {
            s.color = design.color;
        } else if (baseColor) {
            s.color = baseColor;
        }

        if (design?.gradient && design.gradient.length >= 2) {
            s.background = `linear-gradient(90deg, ${design.gradient.join(', ')})`;
            s.WebkitBackgroundClip = 'text';
            s.WebkitTextFillColor = 'transparent';
        }

        if (design?.font === 'monospace') s.fontFamily = "'Fira Code', monospace";
        if (design?.font === 'serif') s.fontFamily = "'Playfair Display', serif";
        if (design?.font === 'cursive') s.fontFamily = "'Dancing Script', cursive";
        if (design?.font === 'display') s.fontFamily = "'Orbitron', sans-serif";

        return s;
    }, [design, baseColor]);

    const classes = useMemo(() => {
        const c = [styles.customName, className];
        
        if (design?.glow === 'neon') c.push(styles.glowNeon);
        if (design?.glow === 'ultra') c.push(styles.glowUltra);
        
        if (design?.animation === 'rainbow') c.push(styles.animRainbow);
        if (design?.animation === 'pulse') c.push(styles.animPulse);
        if (design?.animation === 'shimmer') c.push(styles.animShimmer);

        return c.join(' ');
    }, [design, className]);

    return (
        <span 
            className={classes} 
            style={finalStyle}
            onClick={onClick}
        >
            {username}
        </span>
    );
};
