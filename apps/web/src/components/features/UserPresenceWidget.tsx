import { Music, Gamepad2, Play, ExternalLink } from 'lucide-react'
import { UserActivity } from '../../stores/usePresenceStore'
import styles from '../../styles/modules/features/UserPresenceWidget.module.css'

interface UserPresenceWidgetProps {
    activities: UserActivity[]
    compact?: boolean
}

export function UserPresenceWidget({ activities, compact }: UserPresenceWidgetProps) {
    if (!activities || activities.length === 0) return null

    return (
        <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
            {activities.map((activity, index) => {
                const isSpotify = activity.name.toLowerCase() === 'spotify'
                const isGame = activity.type === 'playing'

                return (
                    <div key={index} className={styles.activityItem}>
                        <div className={styles.iconWrapper}>
                            {isSpotify ? <Music size={16} className={styles.spotifyIcon} /> :
                                isGame ? <Gamepad2 size={16} className={styles.gameIcon} /> :
                                    <Play size={16} className={styles.defaultIcon} />}
                        </div>

                        <div className={styles.content}>
                            <span className={styles.activityHeader}>
                                {activity.type === 'listening' ? 'Listening to' :
                                    activity.type === 'playing' ? 'Playing' :
                                        activity.type === 'streaming' ? 'Streaming' : 'Activity'}
                            </span>
                            <span className={styles.activityName}>{activity.name}</span>
                            {activity.details && <span className={styles.activityDetails}>{activity.details}</span>}
                            {activity.state && <span className={styles.activityState}>{activity.state}</span>}
                        </div>

                        {activity.url && (
                            <a href={activity.url} target="_blank" rel="noopener noreferrer" className={styles.actionBtn}>
                                <ExternalLink size={14} />
                            </a>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
