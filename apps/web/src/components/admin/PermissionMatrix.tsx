/**
 * PermissionMatrix — Pillar IV: The Council
 * A high-density toggle grid for managing all server permissions in a single view.
 */

import React, { useState, useCallback, useMemo } from 'react'
import { Shield, Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import styles from '../../styles/modules/admin/PermissionMatrix.module.css'

// ── Permission Definitions ───────────────────────────────────────────

interface PermissionDef {
    key: string
    label: string
    description: string
    category: 'General' | 'Text' | 'Voice' | 'Advanced'
    bit: number
}

const PERMISSION_DEFS: PermissionDef[] = [
    // General
    { key: 'ADMINISTRATOR', label: 'Administrator', description: 'Full access to everything.', category: 'General', bit: 0 },
    { key: 'MANAGE_SERVER', label: 'Manage Server', description: 'Modify server settings, name, icon.', category: 'General', bit: 1 },
    { key: 'MANAGE_ROLES', label: 'Manage Roles', description: 'Create, edit, and delete roles.', category: 'General', bit: 2 },
    { key: 'MANAGE_CHANNELS', label: 'Manage Channels', description: 'Create, edit, and delete channels.', category: 'General', bit: 3 },
    { key: 'KICK_MEMBERS', label: 'Kick Members', description: 'Remove members from the server.', category: 'General', bit: 4 },
    { key: 'BAN_MEMBERS', label: 'Ban Members', description: 'Permanently ban members.', category: 'General', bit: 5 },
    { key: 'CREATE_INVITE', label: 'Create Invite', description: 'Create invite links.', category: 'General', bit: 6 },
    { key: 'CHANGE_NICKNAME', label: 'Change Nickname', description: 'Change own nickname.', category: 'General', bit: 7 },
    { key: 'MANAGE_NICKNAMES', label: 'Manage Nicknames', description: 'Change other members\' nicknames.', category: 'General', bit: 8 },
    { key: 'VIEW_CHANNELS', label: 'View Channels', description: 'See channels in the server.', category: 'General', bit: 17 },
    // Text
    { key: 'SEND_MESSAGES', label: 'Send Messages', description: 'Post messages in text channels.', category: 'Text', bit: 10 },
    { key: 'MANAGE_MESSAGES', label: 'Manage Messages', description: 'Delete and pin messages by others.', category: 'Text', bit: 9 },
    { key: 'EMBED_LINKS', label: 'Embed Links', description: 'Post rich embeds.', category: 'Text', bit: 11 },
    { key: 'ATTACH_FILES', label: 'Attach Files', description: 'Upload files and images.', category: 'Text', bit: 12 },
    { key: 'ADD_REACTIONS', label: 'Add Reactions', description: 'React to messages.', category: 'Text', bit: 13 },
    { key: 'USE_EXTERNAL_EMOJIS', label: 'External Emojis', description: 'Use emojis from other servers.', category: 'Text', bit: 14 },
    { key: 'MENTION_EVERYONE', label: 'Mention Everyone', description: 'Use @everyone and @here.', category: 'Text', bit: 15 },
    { key: 'SEND_TTS_MESSAGES', label: 'Send TTS', description: 'Send text-to-speech messages.', category: 'Text', bit: 18 },
    { key: 'MANAGE_WEBHOOKS', label: 'Manage Webhooks', description: 'Create and manage webhooks.', category: 'Text', bit: 16 },
    // Voice
    { key: 'CONNECT_VOICE', label: 'Connect', description: 'Join voice channels.', category: 'Voice', bit: 19 },
    { key: 'SPEAK_VOICE', label: 'Speak', description: 'Talk in voice channels.', category: 'Voice', bit: 20 },
    { key: 'MUTE_MEMBERS', label: 'Mute Members', description: 'Server mute others in voice.', category: 'Voice', bit: 21 },
    { key: 'DEAFEN_MEMBERS', label: 'Deafen Members', description: 'Server deafen others in voice.', category: 'Voice', bit: 22 },
    { key: 'MOVE_MEMBERS', label: 'Move Members', description: 'Drag members between voice channels.', category: 'Voice', bit: 23 },
    { key: 'USE_VOICE_ACTIVITY', label: 'Use Voice Activity', description: 'Use voice activity detection.', category: 'Voice', bit: 24 },
    { key: 'PRIORITY_SPEAKER', label: 'Priority Speaker', description: 'Be heard more clearly over others.', category: 'Voice', bit: 25 },
]

// ── Types ────────────────────────────────────────────────────────────

interface Role {
    id: string
    name: string
    color: string | null
    permissions: string  // bigint as string
    position: number
}

interface PermissionMatrixProps {
    roles: Role[]
    onUpdatePermission: (roleId: string, permissionBit: number, enabled: boolean) => void
    onReorderRoles?: (roles: { id: string; position: number }[]) => void
}

// ── Component ────────────────────────────────────────────────────────

export function PermissionMatrix({ roles, onUpdatePermission, onReorderRoles: _onReorderRoles }: PermissionMatrixProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(['General', 'Text', 'Voice', 'Advanced'])
    )

    const categories = useMemo(() => {
        const cats: Record<string, PermissionDef[]> = {}
        for (const perm of PERMISSION_DEFS) {
            if (!cats[perm.category]) cats[perm.category] = []
            cats[perm.category].push(perm)
        }
        return cats
    }, [])

    const toggleCategory = useCallback((cat: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            if (next.has(cat)) next.delete(cat)
            else next.add(cat)
            return next
        })
    }, [])

    const hasPermission = useCallback((permStr: string, bit: number): boolean => {
        try {
            const perms = BigInt(permStr)
            const admin = BigInt(1) << BigInt(0)
            if ((perms & admin) === admin) return true  // Admin has all
            const bitVal = BigInt(1) << BigInt(bit)
            return (perms & bitVal) === bitVal
        } catch {
            return false
        }
    }, [])

    const sortedRoles = useMemo(() =>
        [...roles].sort((a, b) => b.position - a.position),
        [roles]
    )

    return (
        <div className={styles.matrix}>
            <div className={styles.header}>
                <Shield size={20} />
                <h3>Permission Matrix</h3>
            </div>

            <div className={styles.grid}>
                {/* Column Headers — Roles */}
                <div className={styles.cornerCell} />
                {sortedRoles.map(role => (
                    <div key={role.id} className={styles.roleHeader}>
                        <div
                            className={styles.roleColor}
                            style={{ background: role.color || 'var(--text-muted)' }}
                        />
                        <span className={styles.roleName}>{role.name}</span>
                    </div>
                ))}

                {/* Rows — Permissions grouped by category */}
                {Object.entries(categories).map(([category, perms]) => (
                    <React.Fragment key={category}>
                        {/* Category Header */}
                        <div
                            className={styles.categoryRow}
                            onClick={() => toggleCategory(category)}
                            style={{ gridColumn: `1 / span ${sortedRoles.length + 1}` }}
                        >
                            {expandedCategories.has(category) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span>{category}</span>
                            <span className={styles.categoryCount}>{perms.length}</span>
                        </div>

                        {/* Permission Rows */}
                        {expandedCategories.has(category) && perms.map(perm => (
                            <React.Fragment key={perm.key}>
                                <div className={styles.permLabel} title={perm.description}>
                                    {perm.label}
                                </div>
                                {sortedRoles.map(role => {
                                    const enabled = hasPermission(role.permissions, perm.bit)
                                    return (
                                        <button
                                            key={`${role.id}-${perm.key}`}
                                            className={`${styles.toggle} ${enabled ? styles.enabled : styles.disabled}`}
                                            onClick={() => onUpdatePermission(role.id, perm.bit, !enabled)}
                                            title={`${perm.label} for ${role.name}: ${enabled ? 'ON' : 'OFF'}`}
                                        >
                                            {enabled ? <Check size={14} /> : <X size={14} />}
                                        </button>
                                    )
                                })}
                            </React.Fragment>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}
