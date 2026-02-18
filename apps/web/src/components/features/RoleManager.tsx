import { useState } from 'react'
import { Shield, Plus, Edit2, Trash2, Users, ChevronDown, ChevronUp, Copy } from 'lucide-react'
import { Button, Input, Modal } from '../ui'
import { IconPicker } from '../ui/IconPicker'
import { RoleTemplateSelector } from './RoleTemplateSelector'
import { useRolesStore, Role, Permission } from '../../stores/useRolesStore'
import { RoleTemplate } from '../../utils/roleTemplates'
import styles from './RoleManager.module.css'

interface RoleManagerProps {
  serverId: string
}

const permissionGroups: { name: string; permissions: { key: Permission; label: string }[] }[] = [
  {
    name: 'General Permissions',
    permissions: [
      { key: 'ADMINISTRATOR', label: 'Administrator' },
      { key: 'MANAGE_SERVER', label: 'Manage Server' },
      { key: 'MANAGE_ROLES', label: 'Manage Roles' },
      { key: 'MANAGE_CHANNELS', label: 'Manage Channels' },
      { key: 'KICK_MEMBERS', label: 'Kick Members' },
      { key: 'BAN_MEMBERS', label: 'Ban Members' },
      { key: 'CREATE_INVITE', label: 'Create Invite' },
      { key: 'CHANGE_NICKNAME', label: 'Change Nickname' },
      { key: 'MANAGE_NICKNAMES', label: 'Manage Nicknames' },
      { key: 'MANAGE_WEBHOOKS', label: 'Manage Webhooks' },
    ],
  },
  {
    name: 'Text Permissions',
    permissions: [
      { key: 'VIEW_CHANNELS', label: 'View Channels' },
      { key: 'SEND_MESSAGES', label: 'Send Messages' },
      { key: 'SEND_TTS_MESSAGES', label: 'Send TTS Messages' },
      { key: 'MANAGE_MESSAGES', label: 'Manage Messages' },
      { key: 'EMBED_LINKS', label: 'Embed Links' },
      { key: 'ATTACH_FILES', label: 'Attach Files' },
      { key: 'ADD_REACTIONS', label: 'Add Reactions' },
      { key: 'USE_EXTERNAL_EMOJIS', label: 'Use External Emojis' },
      { key: 'MENTION_EVERYONE', label: 'Mention @everyone' },
    ],
  },
  {
    name: 'Voice Permissions',
    permissions: [
      { key: 'CONNECT_VOICE', label: 'Connect' },
      { key: 'SPEAK_VOICE', label: 'Speak' },
      { key: 'MUTE_MEMBERS', label: 'Mute Members' },
      { key: 'DEAFEN_MEMBERS', label: 'Deafen Members' },
      { key: 'MOVE_MEMBERS', label: 'Move Members' },
      { key: 'USE_VOICE_ACTIVITY', label: 'Use Voice Activity' },
      { key: 'PRIORITY_SPEAKER', label: 'Priority Speaker' },
    ],
  },
]

export function RoleManager({ serverId }: RoleManagerProps) {
  const { getRoles, addRole, updateRole, deleteRole } = useRolesStore()
  const roles = getRoles(serverId)
  
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleColor, setNewRoleColor] = useState('#99aab5')
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['General Permissions'])

  const handleCreateFromTemplate = (template: RoleTemplate) => {
    const newRole: Role = {
      id: `role-${Date.now()}`,
      serverId,
      name: template.name,
      color: template.color,
      icon: template.icon,
      permissions: template.permissions,
      position: roles.length,
      mentionable: false,
      hoist: false,
      memberCount: 0,
    }

    addRole(serverId, newRole)
    setShowTemplateSelector(false)
    setSelectedRole(newRole)
  }

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return

    const newRole: Role = {
      id: `role-${Date.now()}`,
      serverId,
      name: newRoleName,
      color: newRoleColor,
      permissions: ['VIEW_CHANNELS', 'SEND_MESSAGES'],
      position: roles.length,
      mentionable: false,
      hoist: false,
      memberCount: 0,
    }

    addRole(serverId, newRole)
    setNewRoleName('')
    setNewRoleColor('#99aab5')
    setShowCreateModal(false)
    setSelectedRole(newRole)
  }

  const handleDeleteRole = (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      deleteRole(serverId, roleId)
      if (selectedRole?.id === roleId) {
        setSelectedRole(null)
      }
    }
  }

  const handleCopyRole = () => {
    if (!selectedRole) return

    const copiedRole: Role = {
      ...selectedRole,
      id: `role-${Date.now()}`,
      name: `${selectedRole.name} (Copy)`,
      position: roles.length,
      memberCount: 0
    }

    addRole(serverId, copiedRole)
    setSelectedRole(copiedRole)
  }

  const togglePermission = (permission: Permission) => {
    if (!selectedRole) return

    const hasPermission = selectedRole.permissions.includes(permission)
    const newPermissions = hasPermission
      ? selectedRole.permissions.filter((p) => p !== permission)
      : [...selectedRole.permissions, permission]

    updateRole(serverId, selectedRole.id, { permissions: newPermissions })
    setSelectedRole({ ...selectedRole, permissions: newPermissions })
  }

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((g) => g !== groupName)
        : [...prev, groupName]
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3>Roles</h3>
          <Button variant="primary" size="sm" onClick={() => setShowTemplateSelector(true)}>
            <Plus size={16} />
          </Button>
        </div>

        <div className={styles.rolesList}>
          {roles
            .sort((a, b) => b.position - a.position)
            .map((role) => (
              <div
                key={role.id}
                className={`${styles.roleItem} ${
                  selectedRole?.id === role.id ? styles.active : ''
                }`}
                onClick={() => setSelectedRole(role)}
              >
                <div
                  className={styles.roleColor}
                  style={{ backgroundColor: role.color }}
                />
                <div className={styles.roleInfo}>
                  <span className={styles.roleName}>{role.name}</span>
                  <span className={styles.memberCount}>
                    <Users size={12} /> {role.memberCount}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className={styles.content}>
        {selectedRole ? (
          <>
            <div className={styles.roleHeader}>
              <div className={styles.roleTitleSection}>
                <Shield size={24} style={{ color: selectedRole.color }} />
                <h2>{selectedRole.name}</h2>
              </div>
              <div className={styles.headerActions}>
                <Button variant="ghost" size="sm" onClick={handleCopyRole} title="Copy Role">
                  <Copy size={16} />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit2 size={16} />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteRole(selectedRole.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>

            <div className={styles.roleSettings}>
              <div className={styles.settingGroup}>
                <label className={styles.label}>Role Name</label>
                <Input
                  value={selectedRole.name}
                  onChange={(e) => {
                    const newName = e.currentTarget.value
                    updateRole(serverId, selectedRole.id, { name: newName })
                    setSelectedRole({ ...selectedRole, name: newName })
                  }}
                />
              </div>

              <div className={styles.settingGroup}>
                <label className={styles.label}>Role Color</label>
                <div className={styles.colorPicker}>
                  <input
                    type="color"
                    value={selectedRole.color}
                    onChange={(e) => {
                      const newColor = e.currentTarget.value
                      updateRole(serverId, selectedRole.id, { color: newColor })
                      setSelectedRole({ ...selectedRole, color: newColor })
                    }}
                  />
                  <span>{selectedRole.color}</span>
                </div>
              </div>

              <div className={styles.settingGroup}>
                <label className={styles.label}>Role Icon</label>
                <IconPicker
                  value={selectedRole.icon}
                  onChange={(icon) => {
                    updateRole(serverId, selectedRole.id, { icon })
                    setSelectedRole({ ...selectedRole, icon })
                  }}
                  color={selectedRole.color}
                />
              </div>

              <div className={styles.settingGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedRole.hoist}
                    onChange={(e) => {
                      const hoist = e.target.checked
                      updateRole(serverId, selectedRole.id, { hoist })
                      setSelectedRole({ ...selectedRole, hoist })
                    }}
                  />
                  Display role members separately from online members
                </label>
              </div>

              <div className={styles.settingGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedRole.mentionable}
                    onChange={(e) => {
                      const mentionable = e.target.checked
                      updateRole(serverId, selectedRole.id, { mentionable })
                      setSelectedRole({ ...selectedRole, mentionable })
                    }}
                  />
                  Allow anyone to @mention this role
                </label>
              </div>
            </div>

            <div className={styles.permissions}>
              <h3 className={styles.permissionsTitle}>Permissions</h3>
              {permissionGroups.map((group) => (
                <div key={group.name} className={styles.permissionGroup}>
                  <button
                    className={styles.groupHeader}
                    onClick={() => toggleGroup(group.name)}
                  >
                    <span>{group.name}</span>
                    {expandedGroups.includes(group.name) ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                  {expandedGroups.includes(group.name) && (
                    <div className={styles.permissionsList}>
                      {group.permissions.map((perm) => (
                        <label key={perm.key} className={styles.permissionItem}>
                          <input
                            type="checkbox"
                            checked={selectedRole.permissions.includes(perm.key)}
                            onChange={() => togglePermission(perm.key)}
                          />
                          <span>{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <Shield size={64} className={styles.emptyIcon} />
            <p>Select a role to edit permissions</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Role"
      >
        <div className={styles.modal}>
          <div className={styles.modalField}>
            <label>Role Name</label>
            <Input
              placeholder="Enter role name..."
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.currentTarget.value)}
            />
          </div>
          <div className={styles.modalField}>
            <label>Role Color</label>
            <input
              type="color"
              value={newRoleColor}
              onChange={(e) => setNewRoleColor(e.currentTarget.value)}
            />
          </div>
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateRole}>
              Create Role
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        title=""
      >
        <RoleTemplateSelector
          onSelect={handleCreateFromTemplate}
          onCancel={() => setShowTemplateSelector(false)}
        />
      </Modal>
    </div>
  )
}
