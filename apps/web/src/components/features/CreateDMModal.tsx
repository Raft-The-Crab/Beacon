import React, { useState } from 'react'
import { MessageSquarePlus, Search, User } from 'lucide-react'
import { useUserListStore } from '../../stores/useUserListStore'
import { useDMStore } from '../../stores/useDMStore'
import { Avatar } from '../ui'
import styles from '../../styles/modules/features/CreateDMModal.module.css'

interface CreateDMModalProps {
    onClose: () => void
}

export function CreateDMModal({ onClose }: CreateDMModalProps) {
    const { friends } = useUserListStore()
    const { setActiveChannel } = useDMStore()
    const [searchQuery, setSearchQuery] = useState('')

    const filteredFriends = friends.filter((f: any) =>
        f.username.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSelectFriend = (friendId: string) => {
        // Logic to find or create a DM channel would go here
        // For now, we'll just mock it or assume it exists in useDMStore
        setActiveChannel(friendId)
        console.log(`Starting DM with ${friendId}`)
        onClose()
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.iconCircle}>
                    <MessageSquarePlus size={24} />
                </div>
                <h2>Select Friends</h2>
                <p>You can add up to 9 more friends to this group.</p>
            </div>

            <div className={styles.searchSection}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Type the username of a friend"
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            <div className={styles.friendsList}>
                {filteredFriends.length > 0 ? (
                    filteredFriends.map((friend: any) => (
                        <div key={friend.id} className={styles.friendRow} onClick={() => handleSelectFriend(friend.id)}>
                            <div className={styles.friendInfo}>
                                <Avatar
                                    src={friend.avatar && !friend.avatar.includes('dicebear') ? friend.avatar : undefined}
                                    username={friend.username}
                                    status={friend.status}
                                    size="md"
                                />
                                <span className={styles.username}>{friend.username}</span>
                            </div>
                            <div className={styles.checkbox} />
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <User size={48} />
                        <p>No friends found matching "{searchQuery}"</p>
                    </div>
                )}
            </div>

            <div className={styles.footer}>
                <button className={styles.createBtn} disabled={true}>
                    Create Group DM
                </button>
            </div>
        </div>
    )
}
