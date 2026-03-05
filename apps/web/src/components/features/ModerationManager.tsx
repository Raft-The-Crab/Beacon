import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/apiClient';
import { Button, useToast, Avatar, Badge, Spinner } from '../ui';
import { Shield, Hammer, UserMinus, Search, Ban } from 'lucide-react';
import styles from '../../styles/modules/features/ModerationManager.module.css';

interface Member {
    userId: string;
    nickname?: string;
    user: {
        username: string;
        discriminator: string;
        avatar?: string;
    };
    roles: { id: string; name: string; color?: string }[];
}

interface ModerationManagerProps {
    guildId: string;
    onClose?: () => void;
}

const ModerationManager: React.FC<ModerationManagerProps> = ({ guildId }) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modifyingId, setModifyingId] = useState<string | null>(null);
    const toast = useToast();

    const loadMembers = useCallback(async () => {
        setLoading(true);
        const res = await apiClient.getGuildMembers(guildId);
        if (res.success) {
            setMembers(res.data);
        } else {
            toast.error('Failed to load members');
        }
        setLoading(false);
    }, [guildId, toast]);

    useEffect(() => { loadMembers(); }, [loadMembers]);

    const handleKick = async (userId: string) => {
        if (!window.confirm('Are you sure you want to kick this member?')) return;
        setModifyingId(userId);
        const res = await apiClient.kickMember(guildId, userId);
        if (res.success) {
            setMembers((prev: Member[]) => prev.filter((m: Member) => m.userId !== userId));
            toast.success('Member kicked');
        } else {
            toast.error(res.error || 'Kick failed');
        }
        setModifyingId(null);
    };

    const handleBan = async (userId: string) => {
        const reason = window.prompt('Reason for ban (optional):');
        if (reason === null) return; // Cancelled

        setModifyingId(userId);
        const res = await apiClient.banMember(guildId, userId, reason);
        if (res.success) {
            setMembers((prev: Member[]) => prev.filter((m: Member) => m.userId !== userId));
            toast.success('Member banned');
        } else {
            toast.error(res.error || 'Ban failed');
        }
        setModifyingId(null);
    };

    const filteredMembers = members.filter(m => {
        const query = search.toLowerCase();
        return (
            m.user.username.toLowerCase().includes(query) ||
            m.nickname?.toLowerCase().includes(query) ||
            m.userId.includes(query)
        );
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleArea}>
                    <Shield size={20} className={styles.titleIcon} />
                    <h2>Member Moderation</h2>
                </div>
                <div className={styles.searchWrap}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search by username, nickname, or ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            <div className={styles.memberList}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <Spinner size="lg" />
                        <p>Scanning server population...</p>
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}><Ban size={48} /></div>
                        <p>{search ? 'No members match your search.' : 'No members found in this server.'}</p>
                    </div>
                ) : (
                    filteredMembers.map((member: Member) => (
                        <div key={member.userId} className={styles.memberCard}>
                            <div className={styles.memberMain}>
                                <Avatar
                                    username={member.user.username}
                                    src={member.user.avatar}
                                    size="md"
                                />
                                <div className={styles.memberInfo}>
                                    <div className={styles.nameGroup}>
                                        <span className={styles.username}>{member.user.username}</span>
                                        {member.nickname && <span className={styles.nickname}>({member.nickname})</span>}
                                    </div>
                                    <div className={styles.rolesGroup}>
                                        {member.roles.map((role: any) => (
                                            <div
                                                key={role.id}
                                                style={{ border: `1px solid ${role.color || 'var(--primary)'}`, color: role.color, borderRadius: '4px', padding: '0 4px' }}
                                            >
                                                <Badge size="sm">
                                                    {role.name}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleKick(member.userId)}
                                    disabled={!!modifyingId}
                                    className={styles.kickBtn}
                                >
                                    <UserMinus size={14} />
                                    <span>Kick</span>
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleBan(member.userId)}
                                    disabled={!!modifyingId}
                                    className={styles.banBtn}
                                >
                                    <Hammer size={14} />
                                    <span>Ban</span>
                                </Button>
                            </div>

                            {modifyingId === member.userId && (
                                <div className={styles.overlay}>
                                    <Spinner size="sm" />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ModerationManager;
