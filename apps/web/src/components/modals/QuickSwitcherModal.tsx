import { useState } from 'react'
import { Search, MessageSquare, Hash, User } from 'lucide-react'
import { Modal } from '../ui/Modal'
import styles from './QuickSwitcherModal.module.css'
import { useDMStore } from '../../stores/useDMStore'
import { useServerStore } from '../../stores/useServerStore'
import { useUserListStore } from '../../stores/useUserListStore'

interface QuickSwitcherModalProps {
    isOpen: boolean
    onClose: () => void
}

export function QuickSwitcherModal({ isOpen, onClose }: QuickSwitcherModalProps) {
    const [query, setQuery] = useState('')
    const { channels, setActiveChannel } = useDMStore()
    const { currentServer } = useServerStore()
    const { friends } = useUserListStore()

    const results = (() => {
        if (!query.trim()) return []
        const q = query.toLowerCase()

        const res: any[] = []

        // Match DMs
        channels.forEach(ch => {
            const name = ch.participants[0]?.username || 'Unknown'
            if (name.toLowerCase().includes(q)) {
                res.push({ type: 'dm', id: ch.id, name, icon: <MessageSquare size={16} /> })
            }
        })

        // Match Server Channels
        currentServer?.channels?.forEach(ch => {
            if (ch.name.toLowerCase().includes(q)) {
                res.push({ type: 'channel', id: ch.id, name: ch.name, icon: <Hash size={16} /> })
            }
        })

        // Match Friends
        friends.forEach(f => {
            if (f.username.toLowerCase().includes(q)) {
                res.push({ type: 'friend', id: f.id, name: f.username, icon: <User size={16} /> })
            }
        })

        return res.slice(0, 8)
    })()

    const handleSelect = (item: any) => {
        if (item.type === 'dm') {
            setActiveChannel(item.id)
        }
        // Handle other types as needed
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            hideHeader
            noPadding
            size="md"
        >
            <div className={styles.container}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        autoFocus
                        placeholder="Where would you like to go?"
                        className={styles.input}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className={styles.results}>
                    {results.length > 0 ? (
                        results.map((item) => (
                            <div
                                key={`${item.type}-${item.id}`}
                                className={styles.resultItem}
                                onClick={() => handleSelect(item)}
                            >
                                <div className={styles.itemIcon}>{item.icon}</div>
                                <span className={styles.itemName}>{item.name}</span>
                                <span className={styles.itemType}>{item.type.toUpperCase()}</span>
                            </div>
                        ))
                    ) : query ? (
                        <div className={styles.noResults}>No results found for "{query}"</div>
                    ) : (
                        <div className={styles.hint}>Type to find channels, dms, or friends</div>
                    )}
                </div>

                <div className={styles.footer}>
                    <span><kbd>Enter</kbd> to select</span>
                    <span><kbd>Esc</kbd> to close</span>
                </div>
            </div>
        </Modal>
    )
}
