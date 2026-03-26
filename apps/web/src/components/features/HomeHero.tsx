import React from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Users, Zap, Shield, Sparkles } from 'lucide-react'
import styles from '../../styles/modules/features/HomeHero.module.css'

export function HomeHero() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={styles.header}
                >
                    <div className={styles.badge}>
                        <Sparkles size={14} />
                        <span>The Advanced Communication Layer</span>
                    </div>
                    <h1 className={styles.title}>Secure. Advanced. <span className={styles.accent}>Yours.</span></h1>
                    <p className={styles.subtitle}>
                        Beacon is built for those who value speed, security, and absolute control over their digital interactions.
                    </p>
                </motion.div>

                <div className={styles.grid}>
                    <FeatureCard 
                        icon={<MessageSquare size={24} />}
                        title="Quantum Speed"
                        description="Experience zero-latency communication powered by our custom high-frequency protocol."
                        delay={0.1}
                    />
                    <FeatureCard 
                        icon={<Shield size={24} />}
                        title="Ironclad Privacy"
                        description="Your data never leaves your control. We prioritize security at every layer of the stack."
                        delay={0.2}
                    />
                    <FeatureCard 
                        icon={<Users size={24} />}
                        title="Vibrant Communities"
                        description="Discover servers designed around meaningful interaction and premium expression."
                        delay={0.3}
                    />
                    <FeatureCard 
                        icon={<Zap size={24} />}
                        title="SDK Architecture"
                        description="Extend your experience with a powerful, developer-first SDK for bots and integrations."
                        delay={0.4}
                    />
                </div>
            </div>
            
            <div className={styles.artContainer}>
                <div className={styles.mainGlow} />
                <div className={styles.orb1} />
                <div className={styles.orb2} />
                <div className={styles.orb3} />
                <div className={styles.gridOverlay} />
            </div>
        </div>
    )
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode; title: string; description: string; delay: number }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
            className={styles.card}
            whileHover={{ y: -5, background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
        >
            <div className={styles.cardIcon}>{icon}</div>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardDesc}>{description}</p>
        </motion.div>
    )
}
