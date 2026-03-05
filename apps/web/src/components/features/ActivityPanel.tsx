import { Gamepad2, Music, Monitor, Circle } from 'lucide-react'
import { Avatar } from '../ui'
import styles from '../../styles/modules/features/ActivityPanel.module.css'
import { useUserListStore } from '../../stores/useUserListStore'
import { usePresenceStore } from '../../stores/usePresenceStore'
import { QuestTracker } from './QuestTracker'


// ACTIVITY_ICONS is defined but not used in the current JSX.
// If it were used, the Film icon would be needed.
// For now, based on the current JSX, Film is not directly rendered.
// const ACTIVITY_ICONS = {
//     playing: <Gamepad2 size={14} />,
//     listening: <Music size={14} />,
//     watching: <Film size={14} />,
//     streaming: <Monitor size={14} />,
//     custom: <Circle size={14} />,
// }

export function ActivityPanel() {
    const friends = useUserListStore(state => state.friends)
    const presences = usePresenceStore(state => state.presences)

    // Merge friends with their real-time presence/activities
    const friendsWithPresence = friends.map(friend => {
        const presence = presences[friend.id]
        return {
            ...friend,
            status: presence?.status || friend.status,
            customStatus: presence?.customStatus || (friend as any).customStatus,
            activities: presence?.activities || (friend as any).activities || []
        }
    })

    const activeFriends = friendsWithPresence.filter(f => f.status !== 'invisible')

    const withActivity = activeFriends.filter(f => f.activities && f.activities.length > 0)
    const withoutActivity = activeFriends.filter(f => !f.activities || f.activities.length === 0)

    return (
        <div className={styles.panel}>
            {/* Inject Beacon Quests System */}
            <QuestTracker />

            <h3 className={styles.title}>Active Now</h3>

            {withActivity.length === 0 ? (
                <div className={styles.empty}>
                    <p>It's quiet for now...</p>
                    <span>When your friends start an activity — like playing a game or listening to music — they'll show up here.</span>
                </div>
            ) : (
                <div className={styles.activityList}>
                    {withActivity.map(friend => (
                        <div key={friend.id} className={styles.activityCard}>
                            <Avatar
                                src={friend.avatar}
                                alt={friend.username}
                                size="sm"
                                status={friend.status}
                                username={friend.username}
                            />
                            <div className={styles.activityInfo}>
                                <span className={styles.friendName}>{friend.username}</span>
                                {friend.activities && friend.activities.map((activity, idx) => (
                                    <div key={idx} className={styles.activityDetail}>
                                        <span className={styles.activityIcon}>
                                            {activity.type === 'listening' ? <Music size={14} /> :
                                                activity.type === 'playing' ? <Gamepad2 size={14} /> :
                                                    activity.type === 'streaming' ? <Monitor size={14} /> :
                                                        <Circle size={14} />}
                                        </span>
                                        <div className={styles.activityText}>
                                            <span className={styles.activityName}>
                                                {activity.type === 'listening' ? 'Listening to ' :
                                                    activity.type === 'playing' ? 'Playing ' :
                                                        activity.type === 'streaming' ? 'Streaming ' : ''}
                                                {activity.name}
                                            </span>
                                            {activity.details && (
                                                <span className={styles.activitySub}>{activity.details}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {withoutActivity.length > 0 && (
                <>
                    <h4 className={styles.subTitle}>Online — {withoutActivity.length}</h4>
                    <div className={styles.onlineList}>
                        {withoutActivity.map(friend => (
                            <div key={friend.id} className={styles.onlineItem}>
                                <Avatar
                                    src={friend.avatar}
                                    alt={friend.username}
                                    size="sm"
                                    status={friend.status}
                                    username={friend.username}
                                />
                                <span className={styles.onlineName}>{friend.username}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
