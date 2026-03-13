import { useState } from 'react'
import { UserPlus, Sparkles, Send } from 'lucide-react'
import { api } from '../../lib/api'
import { useToast } from '../ui'
import styles from '../../styles/modules/features/AddFriendModal.module.css'

interface AddFriendModalProps {
    onClose: () => void
}

export function AddFriendModal({ onClose }: AddFriendModalProps) {
    const [inputValue, setInputValue] = useState('')
    const [loading, setLoading] = useState(false)
    const { show } = useToast()

    const handleAddFriend = async () => {
        if (!inputValue.trim()) return
        setLoading(true)
        try {
            const trimmed = inputValue.trim()
            const match = trimmed.match(/^(.+?)#(\d{4})$/)
            const payload = match
                ? { username: match[1].trim(), discriminator: match[2] }
                : { username: trimmed }

            await api.post('/friends/request', payload)
            show(`Friend request sent to ${trimmed}!`, 'success')
            setInputValue("")
            onClose()
        } catch (error: any) {
            const message = error?.response?.data?.error || 'Could not send friend request. Check the username and try again.'
            show(message, 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.iconCircle}>
                    <UserPlus size={28} />
                </div>
                <h2>Add a Friend</h2>
                <p>Use username or username#1234. Usernames are case-insensitive.</p>
            </div>

            <div className={styles.inputSection}>
                <div className={styles.inputWrapper}>
                    <input
                        type="text"
                        placeholder="Enter username or username#1234..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                        autoFocus
                    />
                    <Sparkles size={18} className={styles.sparkle} />
                </div>
            </div>

            <div className={styles.footer}>
                <button className={styles.cancelBtn} onClick={onClose}>
                    Cancel
                </button>
                <button
                    className={styles.sendBtn}
                    onClick={handleAddFriend}
                    disabled={loading || !inputValue.trim()}
                >
                    {loading ? 'Sending...' : (
                        <>
                            <Send size={16} />
                            <span>Send Friend Request</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
