import React, { useState } from 'react'
import { MessageSquarePlus, Search, User } from 'lucide-react'
import { useUserListStore } from '../../stores/useUserListStore'
import { useDMStore } from '../../stores/useDMStore'
import { apiClient } from '../../services/apiClient'
import { Avatar } from '../ui'
import styles from '../../styles/modules/features/CreateDMModal.module.css'

interface CreateDMModalProps {
    onClose: () => void
}

export function CreateDMModal({ onClose }: CreateDMModalProps) {
    const { friends, fetchFriends } = useUserListStore()
    const { fetchChannels, setActiveChannel } = useDMStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([])
    const [isCreatingGroup, setIsCreatingGroup] = useState(false)

    const filteredFriends = friends.filter((f: any) =>
        (f.username || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    React.useEffect(() => {
        if (friends.length === 0) {
            void fetchFriends()
        }
    }, [friends.length, fetchFriends])

    const handleSelectFriend = (friendId: string) => {
        setSelectedFriendIds(prev => prev.includes(friendId)
            ? prev.filter(id => id !== friendId)
            : prev.length >= 9 ? prev : [...prev, friendId])
    }

    const handleCreateGroupDM = async () => {
        if (selectedFriendIds.length === 0) return
        setIsCreatingGroup(true)
        try {
            const { data } = await apiClient.request('POST', '/dms', { userIds: selectedFriendIds })
            await fetchChannels()
            if (data?.id) {
                setActiveChannel(data.id)
            }
            onClose()
        } catch (error) {
            console.error('Failed to create group DM', error)
        } finally {
            setIsCreatingGroup(false)
        }
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
                        <div key={friend.id} className={styles.friendRow} onClick={() => void handleSelectFriend(friend.id)}>
                            <div className={styles.friendInfo}>
                                <Avatar
                                    src={friend.avatar && !friend.avatar.includes('dicebear') ? friend.avatar : undefined}
                                    username={friend.username}
                                    status={friend.status}
                                    size="md"
                                />
                                <span className={styles.username}>{friend.username}</span>
                            </div>
                            <div className={styles.checkbox}>
                                {selectedFriendIds.includes(friend.id) ? '✓' : ''}
                            </div>
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
                <button
                    className={styles.createBtn}
                    disabled={selectedFriendIds.length === 0 || isCreatingGroup}
                    onClick={() => void handleCreateGroupDM()}
                >
                    {isCreatingGroup ? 'Creating Group DM...' : `Create Group DM (${selectedFriendIds.length})`}
                </button>
            </div>
        </div>
    )
}
