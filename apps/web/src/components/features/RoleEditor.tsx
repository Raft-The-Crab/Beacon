import { useState } from 'react'
import { Shield, Layers, Settings, Trash2 } from 'lucide-react'
import { Button } from '../ui'
import { useRolesStore, Role, Permission } from '../../stores/useRolesStore'
import styles from '../../styles/modules/features/RoleEditor.module.css'

interface RoleEditorProps {
    serverId: string
}

const permissionGroups: { name: string; permissions: { key: Permission; label: string; description: string }[] }[] = [
    {
        name: 'General Permissions',
        permissions: [
            { key: 'ADMINISTRATOR', label: 'Administrator', description: 'Grants all permissions. This is a dangerous permission.' },
            { key: 'MANAGE_SERVER', label: 'Manage Server', description: 'Allows changing server name, region, and settings.' },
            { key: 'MANAGE_ROLES', label: 'Manage Roles', description: 'Allows creating, editing, and deleting roles below this one.' },
            { key: 'MANAGE_CHANNELS', label: 'Manage Channels', description: 'Allows creating, editing, and deleting channels.' },
            { key: 'KICK_MEMBERS', label: 'Kick Members', description: 'Allows removing members from the server.' },
            { key: 'BAN_MEMBERS', label: 'Ban Members', description: 'Allows permanently banning members.' },
            { key: 'VIEW_AUDIT_LOG', label: 'View Audit Log', description: 'Allows viewing the server audit logs.' },
        ],
    },
    {
        name: 'Membership Permissions',
        permissions: [
            { key: 'CREATE_INVITE', label: 'Create Invite', description: 'Allows inviting new members.' },
            { key: 'CHANGE_NICKNAME', label: 'Change Nickname', description: 'Allows members to change their own nickname.' },
            { key: 'MANAGE_NICKNAMES', label: 'Manage Nicknames', description: 'Allows changing other members\' nicknames.' },
        ],
    },
    {
        name: 'Text Permissions',
        permissions: [
            { key: 'VIEW_CHANNELS', label: 'View Channels', description: 'Allows reading text channels and seeing voice channels.' },
            { key: 'SEND_MESSAGES', label: 'Send Messages', description: 'Allows sending text messages.' },
            { key: 'MANAGE_MESSAGES', label: 'Manage Messages', description: 'Allows deleting other members\' messages.' },
            { key: 'ATTACH_FILES', label: 'Attach Files', description: 'Allows uploading attachments.' },
            { key: 'ADD_REACTIONS', label: 'Add Reactions', description: 'Allows reacting to messages.' },
            { key: 'READ_MESSAGE_HISTORY', label: 'Read Message History', description: 'Allows reading past messages in channels.' },
        ],
    },
]

export function RoleEditor({ serverId }: RoleEditorProps) {
    const { getRoles, updateRole, reorderRoles } = useRolesStore()
    const roles = getRoles(serverId).sort((a, b) => b.position - a.position)

    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(roles[0]?.id || null)
    const selectedRole = roles.find(r => r.id === selectedRoleId)
    const [draggedRoleId, setDraggedRoleId] = useState<string | null>(null)

    const handleTogglePermission = (pref: Permission) => {
        if (!selectedRole) return
        const hasPerm = selectedRole.permissions.includes(pref)
        const newPerms = hasPerm
            ? selectedRole.permissions.filter(p => p !== pref)
            : [...selectedRole.permissions, pref]

        updateRole(serverId, selectedRole.id, { permissions: newPerms })
    }

    const handleUpdateRole = (updates: Partial<Role>) => {
        if (!selectedRole) return
        updateRole(serverId, selectedRole.id, updates)
    }

    const handleDrop = (targetIndex: number) => {
        if (!draggedRoleId) return
        const currentIdx = roles.findIndex(r => r.id === draggedRoleId)
        if (currentIdx === targetIndex) return

        const newRoles = [...roles]
        const [draggedRole] = newRoles.splice(currentIdx, 1)
        newRoles.splice(targetIndex, 0, draggedRole)

        reorderRoles(serverId, newRoles)
        setDraggedRoleId(null)
    }

    return (
        <div className={styles.container}>
            {/* Role Hierarchy Sidebar */}
            <div className={styles.hierarchySidebar}>
                <div className={styles.sidebarHeader}>
                    <Layers size={18} />
                    <h3>Role Hierarchy</h3>
                </div>
                <div className={styles.roleList}>
                    {roles.map((role, idx) => (
                        <div
                            key={role.id}
                            className={`${styles.roleItem} ${selectedRoleId === role.id ? styles.selected : ''} ${draggedRoleId === role.id ? styles.dragging : ''}`}
                            draggable
                            onDragStart={() => setDraggedRoleId(role.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(idx)}
                            onClick={() => setSelectedRoleId(role.id)}
                        >
                            <div className={styles.roleIndicator} style={{ backgroundColor: role.color }} />
                            <span className={styles.roleName}>{role.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor Content */}
            <div className={styles.editorMain}>
                {selectedRole ? (
                    <div className={styles.editorScroll}>
                        <header className={styles.editorHeader}>
                            <div className={styles.rolePrimaryInfo}>
                                <div className={styles.roleColorCircle} style={{ backgroundColor: selectedRole.color }} />
                                <div>
                                    <h2>{selectedRole.name}</h2>
                                    <p className={styles.roleMetadata}>ID: {selectedRole.id} • {selectedRole.memberCount} Members</p>
                                </div>
                            </div>
                            <div className={styles.actionButtons}>
                                <Button variant="secondary" size="sm"><Settings size={16} /> Edit Details</Button>
                                <Button variant="danger" size="sm"><Trash2 size={16} /></Button>
                            </div>
                        </header>

                        <div className={styles.section}>
                            <h4>Display Settings</h4>
                            <div className={styles.settingCard}>
                                <div className={styles.settingInfo}>
                                    <p className={styles.settingLabel}>Display role members separately</p>
                                    <p className={styles.settingDesc}>Shows members of this role in their own category in the member list.</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={selectedRole.hoist}
                                    onChange={(e) => handleUpdateRole({ hoist: e.target.checked })}
                                />
                            </div>
                            <div className={styles.settingCard}>
                                <div className={styles.settingInfo}>
                                    <p className={styles.settingLabel}>Allow anyone to @mention this role</p>
                                    <p className={styles.settingDesc}>Allows all members to ping this role in messages.</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={selectedRole.mentionable}
                                    onChange={(e) => handleUpdateRole({ mentionable: e.target.checked })}
                                />
                            </div>
                        </div>

                        <div className={styles.section}>
                            <h4>Bitwise Permissions</h4>
                            {permissionGroups.map(group => (
                                <div key={group.name} className={styles.permissionGroup}>
                                    <h5 className={styles.groupTitle}>{group.name}</h5>
                                    <div className={styles.permissionList}>
                                        {group.permissions.map(perm => (
                                            <div key={perm.key} className={styles.permissionRow}>
                                                <div className={styles.permText}>
                                                    <p className={styles.permLabel}>{perm.label}</p>
                                                    <p className={styles.permDesc}>{perm.description}</p>
                                                </div>
                                                <div
                                                    className={`${styles.permSwitch} ${selectedRole.permissions.includes(perm.key) ? styles.active : ''}`}
                                                    onClick={() => handleTogglePermission(perm.key)}
                                                >
                                                    <div className={styles.switchHandle} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <Shield size={48} />
                        <p>Select a role from the hierarchy to begin editing.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
