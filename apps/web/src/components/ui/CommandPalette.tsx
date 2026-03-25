import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Hash, Server, User as UserIcon, Keyboard, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useServerStore } from '../../stores/useServerStore';
import { useUserListStore } from '../../stores/useUserListStore';
import { apiClient } from '../../services/apiClient';

const EMPTY_ARRAY: any[] = [];

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [globalUsers, setGlobalUsers] = useState<any[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const servers = useServerStore(s => s.servers || EMPTY_ARRAY);
    const channels = useServerStore(s => s.currentServer?.channels || EMPTY_ARRAY);
    const friends = useUserListStore(s => s.friends || EMPTY_ARRAY);

    useEffect(() => {
        if (!query || query.length < 2) {
            setGlobalUsers([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await apiClient.searchUsers(query);
                if (res.success && Array.isArray(res.data)) {
                    const friendIds = new Set(friends.map(f => f.id));
                    const filtered = res.data.filter((u: any) => !friendIds.has(u.id));
                    setGlobalUsers(filtered);
                }
            } catch (err) {}
        }, 250);
        return () => clearTimeout(timer);
    }, [query, friends]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(o => !o);
                setQuery('');
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const lowerQuery = query.toLowerCase();
    
    // Fuzzy Filter Data - Memoized to prevent unnecessary re-renders
    const results = React.useMemo(() => {
        const local = [
            ...servers.filter((s: any) => String(s.name || '').toLowerCase().includes(lowerQuery)).map((s: any) => ({ type: 'server', id: s.id, name: s.name, icon: <Server size={18} /> })),
            ...channels.filter((c: any) => String(c.name || '').toLowerCase().includes(lowerQuery)).map((c: any) => ({ type: 'channel', id: c.id, name: c.name, icon: <Hash size={18} /> })),
            ...friends.filter((f: any) => String(f.username || '').toLowerCase().includes(lowerQuery)).map((f: any) => ({ type: 'user', id: f.id, name: f.username, icon: <UserIcon size={18} /> }))
        ];
        const global = globalUsers.map(u => ({ type: 'global user', id: u.id, name: u.username, icon: <Globe size={18} opacity={0.5} /> }));
        return [...local, ...global].slice(0, 8);
    }, [servers, channels, friends, lowerQuery, globalUsers]);

    const handleSelect = (idx: number) => {
        const item = results[idx];
        if (!item) return;

        setIsOpen(false);
        if (item.type === 'server') navigate(`/channels/${item.id}`);
        if (item.type === 'channel') navigate(`/channels/${useServerStore.getState().currentServer?.id}/${item.id}`);
        if (item.type === 'user') navigate(`/channels/@me/${item.id}`);
        if (item.type === 'global user') navigate(`/user/${item.id}`);
    };

    const handleKeyNav = (e: React.KeyboardEvent) => {
        if (results.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleSelect(selectedIndex);
        }
    };

    const content = (
        <AnimatePresence>
            <motion.div
                key="command-palette-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    zIndex: 99999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: '15vh'
                }}
                onClick={() => setIsOpen(false)}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={{
                        width: '100%', maxWidth: 550, backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-xl)', overflow: 'hidden',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--bg-modifier-hover)' }}>
                        <Search size={22} color="var(--text-muted)" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSelectedIndex(0);
                            }}
                            onKeyDown={handleKeyNav}
                            placeholder="Where would you like to go?"
                            style={{
                                flex: 1, background: 'transparent', border: 'none',
                                color: 'var(--text-normal)', fontSize: 18, marginLeft: 12, outline: 'none'
                            }}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                            <kbd style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4, fontSize: 11, color: 'var(--text-muted)' }}>ESC</kbd>
                        </div>
                    </div>

                    <div style={{ padding: '8px' }}>
                        {results.length > 0 ? (
                            results.map((r, i) => (
                                <div
                                    key={r.type + r.id}
                                    onMouseEnter={() => setSelectedIndex(i)}
                                    onClick={() => handleSelect(i)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                                        borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                        backgroundColor: selectedIndex === i ? 'var(--bg-modifier-selected)' : 'transparent',
                                        color: selectedIndex === i ? 'var(--text-normal)' : 'var(--text-muted)',
                                        transition: 'background 0.1s'
                                      }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>{r.icon}</span>
                                    <span style={{ fontSize: 15, fontWeight: (selectedIndex === i) ? 600 : 500 }}>{r.name}</span>
                                    <span style={{ marginLeft: 'auto', fontSize: 11, textTransform: 'uppercase', opacity: 0.5, fontWeight: 700 }}>{r.type}</span>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Keyboard size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                                No results found for &quot;{query}&quot;
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );

    const target = document.getElementById('modal-root') || document.body;
    return createPortal(content, target);
}
