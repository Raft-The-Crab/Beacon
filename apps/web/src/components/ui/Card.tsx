import React from 'react';
import styles from './Card.module.css';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'premium' | 'glass' | 'outline';
    glow?: 'primary' | 'accent' | 'none';
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    variant = 'premium',
    glow = 'none',
    onClick
}) => {
    const cardClasses = [
        styles.card,
        styles[variant],
        glow !== 'none' ? styles[`glow-${glow}`] : '',
        className
    ].join(' ');

    return (
        <div className={cardClasses} onClick={onClick}>
            <div className={styles.reflection} />
            <div className={styles.content}>
                {children}
            </div>
        </div>
    );
};
