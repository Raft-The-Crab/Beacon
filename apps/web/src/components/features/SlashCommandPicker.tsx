import { useState, useEffect, useRef, useMemo } from 'react'
import { Terminal, Command } from 'lucide-react'
import { useInteractionStore } from '../../stores/useInteractionStore'
import styles from '../../styles/modules/features/SlashCommandPicker.module.css'

interface SlashCommandPickerProps {
    query: string
    guildId?: string
    onSelect: (command: any) => void
    onClose: () => void
}

export function SlashCommandPicker({ query, guildId, onSelect, onClose }: SlashCommandPickerProps) {
    const { commands, fetchCommands } = useInteractionStore()
    const [selectedIndex, setSelectedIndex] = useState(0)
    const listRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchCommands(guildId)
    }, [guildId, fetchCommands])

    const filtered = useMemo(() => {
        const lowerSearch = String(query || '').toLowerCase().replace(/^\//, '')
        return commands.filter(cmd => 
            String(cmd.name || '').toLowerCase().includes(lowerSearch) || 
            String(cmd.description || '').toLowerCase().includes(lowerSearch)
        ).slice(0, 10)
    }, [commands, query])

    useEffect(() => {
        setSelectedIndex(0)
    }, [query])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (filtered.length === 0) return

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
                <Terminal size={14} className={styles.headerIcon} />
                <span>SLASH COMMANDS</span>
            </div>
            <div className={styles.list} ref={listRef}>
                {filtered.map((cmd, index) => (
                    <div
                        key={cmd.name}
                        className={`${styles.item} ${index === selectedIndex ? styles.selected : ''}`}
                        onClick={() => onSelect(cmd)}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        <div className={styles.itemIcon}>
                            <Command size={16} />
                        </div>
                        <div className={styles.itemContent}>
                            <div className={styles.itemName}>/{cmd.name}</div>
                            <div className={styles.itemDesc}>{cmd.description}</div>
                        </div>
                        {cmd.usage && (
                            <div className={styles.itemUsage}>{cmd.usage}</div>
                        )}
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
