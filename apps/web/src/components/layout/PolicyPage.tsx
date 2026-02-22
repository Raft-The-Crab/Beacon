import React from 'react';
import styles from './PolicyPage.module.css';

interface PolicyPageProps {
    title: string;
    lastUpdated?: string;
    children: React.ReactNode;
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ title, lastUpdated, children }) => {
    return (
        <div className={styles.container}>
            <div className={styles.atmosGlow} />
            <div className={styles.orb} style={{ top: '20%', right: '10%' }} />
            <div className={styles.orb} style={{ bottom: '10%', left: '5%', animationDelay: '-10s' }} />

            <div className={styles.content}>
                <header className={styles.header}>
                    <h1 className={styles.title}>{title}</h1>
                    {lastUpdated && <p className={styles.lastUpdated}>Last Updated: {lastUpdated}</p>}
                </header>
                <div className={styles.body}>
                    {children}
                </div>
            </div>
        </div>
    );
};
