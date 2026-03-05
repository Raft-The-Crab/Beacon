import { useState } from 'react'
import { Gift, X, Search, Send } from 'lucide-react'
import { Button } from '../ui'
import { useShopStore } from '../../stores/useShopStore'
import { api } from '../../lib/api'
import styles from '../../styles/components/modals/GiftingModal.module.css'

interface GiftingModalProps {
    item: any
    onClose: () => void
}

export function GiftingModal({ item, onClose }: GiftingModalProps) {
    const [search, setSearch] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [selectedFriend, setSelectedFriend] = useState<any>(null)
    const [message, setMessage] = useState('')
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    const { sendGift } = useShopStore()

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!search.trim()) return
        try {
            const { data } = await api.get(`/friends/search?query=${search}`)
            setResults(data)
        } catch (err) {
            console.error('Search failed')
        }
    }

    const handleSend = async () => {
        if (!selectedFriend) return
        setStatus('sending')
        try {
            await sendGift(selectedFriend.id, item.id, item.type, message)
            setStatus('success')
            setTimeout(onClose, 2000)
        } catch (err: any) {
            setStatus('error')
            setErrorMessage(err.message)
        }
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.title}>
                        <Gift size={20} className={styles.giftIcon} />
                        <h2>Gift {item.name}</h2>
                    </div>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <div className={styles.content}>
                    {status === 'success' ? (
                        <div className={styles.success}>
                            <Send size={48} />
                            <h3>Gift Sent!</h3>
                            <p>Your gift has been sent to {selectedFriend.username}.</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.section}>
                                <label>Send to Friend</label>
                                <form onSubmit={handleSearch} className={styles.searchBar}>
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by username..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </form>

                                <div className={styles.results}>
                                    {results.map(f => (
                                        <div
                                            key={f.id}
                                            className={`${styles.resultItem} ${selectedFriend?.id === f.id ? styles.selected : ''}`}
                                            onClick={() => setSelectedFriend(f)}
                                        >
                                            <img src={f.avatar || '/default-avatar.png'} alt="" />
                                            <span>{f.username}#{f.discriminator}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.section}>
                                <label>Add a Message (Optional)</label>
                                <textarea
                                    placeholder="Write something nice..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    maxLength={200}
                                />
                            </div>

                            {status === 'error' && <div className={styles.error}>{errorMessage}</div>}

                            <div className={styles.footer}>
                                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                                <Button
                                    variant="primary"
                                    disabled={!selectedFriend || status === 'sending'}
                                    onClick={handleSend}
                                >
                                    {status === 'sending' ? 'Sending...' : `Send Gift (${item.price || 'Beacon+'})`}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
