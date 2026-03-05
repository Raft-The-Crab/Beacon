import { useState, useEffect, useRef } from 'react'
import { AtSign, User } from 'lucide-react'
import styles from '../../styles/modules/features/SlashCommandPicker.module.css' // Reusing picker styles for consistency

interface MentionMember {
    id: string
    username: string
    displayName?: string
    avatar?: string
}

interface MentionPickerProps {
    query: string
    members: MentionMember[]
    onSelect: (member: MentionMember) => void
    onClose: () => void
}

export function MentionPicker({ query, members, onSelect, onClose }: MentionPickerProps) {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const listRef = useRef<HTMLDivElement>(null)

    const filtered = members.filter(m =>
        m.username.toLowerCase().includes(query.toLowerCase()) ||
        m.displayName?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8)

    useEffect(() => {
        setSelectedIndex(0)
    }, [query])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(prev => (prev + 1) % filtered.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length)
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault()
                if (filtered[selectedIndex]) {
                    onSelect(filtered[selectedIndex])
                }
            } else if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [filtered, selectedIndex, onSelect, onClose])

    if (filtered.length === 0) return null

    return (
        <div className={styles.picker}>
            <div className={styles.header}>
                <AtSign size={14} className={styles.headerIcon} />
                <span>MEMBERS</span>
            </div>
            <div className={styles.list} ref={listRef}>
                {filtered.map((member, index) => (
                    <div
                        key={member.id}
                        className={`${styles.item} ${index === selectedIndex ? styles.selected : ''}`}
                        onClick={() => onSelect(member)}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        <div className={styles.itemIcon}>
                            {member.avatar ? (
                                <img src={member.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />
                            ) : (
                                <User size={16} />
                            )}
                        </div>
                        <div className={styles.itemContent}>
                            <span className={styles.itemName}>
                                {member.displayName || member.username}
                            </span>
                            <span className={styles.itemDesc}>@{member.username}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.footer}>
                <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
                <span><kbd>↵</kbd> select</span>
                <span><kbd>esc</kbd> dismiss</span>
            </div>
        </div>
    )
}
