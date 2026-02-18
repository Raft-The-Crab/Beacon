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
