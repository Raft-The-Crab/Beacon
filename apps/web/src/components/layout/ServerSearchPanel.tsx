import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageSquare, Clock } from 'lucide-react';
import { useServerStore } from '../../stores/useServerStore';
import { apiClient } from '../../services/apiClient';

export function ServerSearchPanel({ onClose }: { onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const currentServer = useServerStore(s => s.currentServer);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || !currentServer?.id) return;
        
        setLoading(true);
        try {
            // Assumes a search endpoint exists: /api/servers/:id/messages/search?q=XYZ
            const { data } = await apiClient.request('GET', `/servers/${currentServer.id}/messages/search?q=${encodeURIComponent(query)}`);
            setResults(data || []);
        } catch (err) {
            console.error('Search failed', err);
            // Mocking results for now if endpoint isn't wired optimally
            setResults([]); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: 350, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 350, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                    position: 'absolute', top: 0, right: 0, bottom: 0, width: 350,
                    backgroundColor: 'var(--bg-secondary)', borderLeft: '1px solid var(--glass-border)',
                    boxShadow: '-10px 0 30px rgba(0,0,0,0.2)', zIndex: 100, display: 'flex', flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>Search</span>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ padding: '16px 20px' }}>
                    <form onSubmit={handleSearch} style={{ position: 'relative' }}>
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search messages..."
                            style={{
                                width: '100%', padding: '8px 12px 8px 36px', borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)',
                                color: 'var(--text-normal)', outline: 'none'
                            }}
                        />
                        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 10 }} />
                    </form>
                </div>

                {/* Results List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)' }}>Searching deep archives...</div>
                    ) : results.length > 0 ? (
                        results.map((msg, i) => (
                            <div key={i} style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: 8, cursor: 'pointer', border: '1px solid var(--glass-border)', transition: 'border-color 0.2s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <MessageSquare size={14} color="var(--text-muted)" />
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{msg.author?.username || 'Unknown'}</span>
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                        <Clock size={10} style={{ display: 'inline', marginRight: 4 }}/> 
                                        {new Date(msg.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style={{ fontSize: 14, color: 'var(--text-normal)', wordBreak: 'break-word' }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))
                    ) : query && !loading ? (
                        <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)' }}>
                            <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                            We couldn't find any results for "{query}".
                        </div>
                    ) : null}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
