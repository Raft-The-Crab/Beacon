import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../components/ui';
import styles from '../styles/modules/pages/Updates.module.css';

export const Updates: React.FC = () => {
    return (
        <div className={styles.container}>
            <motion.div 
                className={styles.header}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1>Platform Updates</h1>
                <p>Track the evolution of Beacon. New features, security hardening, and performance improvements.</p>
            </motion.div>

            <div className={styles.updatesGrid}>
                {/* V2.1.0 Update */}
                <motion.div 
                    className={styles.updateCard}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className={styles.cardHeader}>
                        <div className={styles.versionInfo}>
                            <Badge variant="beacon-plus">v2.1.0</Badge>
                            <span className={styles.date}>March 24, 2026</span>
                        </div>
                        <h2 className={styles.title}>Infrastructure Hardening & Phase 1 Tiering</h2>
                    </div>
                    
                    <div className={styles.content}>
                        <p className={styles.summary}>
                            This release focuses on industrial-grade stability, backend protocol consolidation, and the initial rollout of the Beacon+ resource management system.
                        </p>
                        
                        <div className={styles.section}>
                            <h3>Protocol & Security</h3>
                            <ul>
                                <li><strong>Standardized Gateway:</strong> Unified high-availability communication on Port 8000 across the internal mesh network.</li>
                                <li><strong>Auth Consolidation:</strong> Centralized 2FA logic within the core AuthController to minimize lateral security risks.</li>
                                <li><strong>Scoped Logic:</strong> Resolved user-specific mutation edge cases in the reaction engine.</li>
                            </ul>
                        </div>

                        <div className={styles.section}>
                            <h3>Data Lifecycle</h3>
                            <ul>
                                <li><strong>Soft-Delete Architecture:</strong> Implemented a 5-day automated retention cycle for message objects prior to permanent database purge.</li>
                                <li><strong>Automated Cleanup:</strong> Scheduled worker service for background attachment and orphan data removal.</li>
                            </ul>
                        </div>

                        <div className={styles.section}>
                            <h3>Beacon+ Tiering</h3>
                            <ul>
                                <li><strong>Resolution Scaling:</strong> Enabled 1080p, 1440p, and 4K bitrate profiles exclusively for premium subscribers.</li>
                                <li><strong>Identity Customization:</strong> Unlocked custom display name editing for enhanced profile personalization.</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                {/* V2.0.0 Update */}
                <motion.div 
                    className={styles.updateCard}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                >
                    <div className={styles.cardHeader}>
                        <div className={styles.versionInfo}>
                            <Badge variant="info">v2.0.0</Badge>
                            <span className={styles.date}>March 15, 2026</span>
                        </div>
                        <h2 className={styles.title}>The Next Generation Protocol</h2>
                    </div>

                    <div className={styles.content}>
                        <p className={styles.summary}>
                            Beacon V2 represents a fundamental shift in our architectural philosophy, prioritizing end-to-end privacy and low-latency interaction.
                        </p>
                        
                        <div className={styles.section}>
                            <h3>Core Systems</h3>
                            <ul>
                                <li><strong>E2EE Default:</strong> Native integration of noise-protocol based encryption for all P2P and Group DM sessions.</li>
                                <li><strong>Omni-Search:</strong> Deployed a high-performance indexing microservice for sub-millisecond data retrieval.</li>
                                <li><strong>The Mesh:</strong> Entirely rewritten UI using our proprietary glassmorphism design tokens.</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </div>

            <footer className={styles.footer}>
                <p>&copy; 2026 Beacon Platform. Powered by RaftTheCrab.</p>
            </footer>
        </div>
    );
};
