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
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <Badge variant="beacon-plus" className={styles.versionBadge}>v2.1.0</Badge>
                    <span className={styles.date}>March 24, 2026</span>
                    <h2 className={styles.title}>System Hardening & UI Polish</h2>
                    <div className={styles.content}>
                        <p>This update focuses on infrastructure stability and premium tier enforcement.</p>
                        <ul>
                            <li><strong>Message Lifecycle:</strong> Implemented 5-day soft-delete retention and automated purge worker.</li>
                            <li><strong>Tier Restrictions:</strong> 1080p, 1440p, and 4k video streaming now requires Beacon+.</li>
                            <li><strong>Display Names:</strong> Customized display names are now a premium-only feature.</li>
                            <li><strong>Security:</strong> Consolidated 2FA logic and aligned gateway ports to 8000 for improved reliability.</li>
                            <li><strong>UI Fixes:</strong> Resolved sidebar clipping issues and refined the User Profile modal.</li>
                        </ul>
                    </div>
                </motion.div>

                {/* V2.0.0 Update */}
                <motion.div 
                    className={styles.updateCard}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <Badge variant="info" className={styles.versionBadge}>v2.0.0</Badge>
                    <span className={styles.date}>March 15, 2026</span>
                    <h2 className={styles.title}>The Next Generation of Chat</h2>
                    <div className={styles.content}>
                        <p>Welcome to Beacon V2. A complete rewrite from the ground up focused on privacy and speed.</p>
                        <ul>
                            <li><strong>End-to-End Encryption:</strong> All direct messages are now secured with E2EE by default.</li>
                            <li><strong>New Mesh Engine:</strong> Experience ultra-smooth gradients and glassmorphism across the entire UI.</li>
                            <li><strong>Sub-channels:</strong> Organize your servers with nested channel hierarchies.</li>
                            <li><strong>Global Search:</strong> Instantly find messages, users, and servers with our new Omni-Search.</li>
                        </ul>
                    </div>
                </motion.div>
            </div>

            <footer className={styles.footer}>
                <p>&copy; 2026 Beacon Platform. Powered by RaftTheCrab.</p>
            </footer>
        </div>
    );
};
