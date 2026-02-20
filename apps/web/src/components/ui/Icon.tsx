import React from 'react';
import { LucideIcon } from 'lucide-react';

interface IconProps {
    icon: LucideIcon;
    size?: number | string;
    className?: string;
    animation?: 'bounce' | 'spin' | 'pulse' | 'none';
    color?: string;
}

export const Icon: React.FC<IconProps> = ({
    icon: IconComponent,
    size = 20,
    className = '',
    animation = 'none',
    color
}) => {
    const animationClass = animation !== 'none' ? `icon-${animation}` : '';
    const classes = `${animationClass} ${className}`.trim();

    return (
        <IconComponent
            size={size}
            className={classes}
            style={color ? { color } : undefined}
        />
    );
};
