import React from 'react'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { UserBadges } from '../ui/UserBadges'
import { CustomUsername } from '../ui/CustomUsername'
import styles from '../../styles/modules/features/IdentityPreview.module.css'

interface IdentityPreviewProps {
    user: any
    nameDesign?: any
    frameUrl?: string
    frameGradient?: string
    bannerUrl?: string
    profileColor?: string
    pronouns?: string
    bio?: string
}

export const IdentityPreview: React.FC<IdentityPreviewProps> = ({
    user,
    nameDesign,
    frameUrl,
    frameGradient,
    bannerUrl,
    profileColor,
    pronouns,
    bio
}) => {
    const resolveBannerUrl = (b?: string | null) => {
        if (!b) return null
        if (b.startsWith('http') || b.startsWith('https') || b.startsWith('data:') || b.startsWith('/')) return b
        return `/art/banners/${b}.png`
    }

    const banner = resolveBannerUrl(bannerUrl)

    return (
        <div className={styles.wrapper}>
            <motion.div 
                className={styles.card}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                {/* Banner */}
                <div 
                    className={styles.banner}
                    style={banner ? { backgroundImage: `url(${banner})` } : { background: profileColor || 'var(--beacon-brand)' }}
                >
                    <div className={styles.bannerOverlay} />
                </div>

                {/* Profile Header */}
                <div className={styles.header}>
                    <div className={styles.avatarWrapper}>
                        <Avatar
                            src={user?.avatar && !user.avatar.includes('dicebear') ? user.avatar : undefined}
                            username={user?.username}
                            size="lg"
                            frameUrl={frameUrl}
                            frameGradient={frameGradient}
                            status={user?.status || 'online'}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    <div className={styles.identity}>
                        <h1 className={styles.username}>
                            <CustomUsername 
                                username={user?.displayName || user?.username || 'Username'} 
                                design={nameDesign} 
                            />
                        </h1>
                        <p className={styles.handle}>
                            @{user?.username || 'user'}{user?.discriminator ? `#${user.discriminator}` : '#0000'}
                            {pronouns && <span className={styles.pronouns}> • {pronouns}</span>}
                        </p>
                    </div>

                    <div className={styles.badges}>
                        <UserBadges badges={user?.badges || []} size="sm" />
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionHeader}>ABOUT ME</h3>
                        <p className={styles.bio}>{bio || 'This is how your bio will look.'}</p>
                    </div>

                    <div className={styles.meta}>
                        <span className={styles.metaLabel}>MEMBER SINCE</span>
                        <span className={styles.metaValue}>
                            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
