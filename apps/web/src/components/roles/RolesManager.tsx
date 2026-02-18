import React, { useState } from 'react';
import { useServerStore } from '../../stores/useServerStore';
import { Role } from '@beacon/types';
import styles from './RolesManager.module.css';

// Local permission flags for the UI to avoid dependency loops in this fix
const PermissionFlags = {
  ADMINISTRATOR: 1n << 3n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_GUILD: 1n << 5n,
  SEND_MESSAGES: 1n << 11n,
  MANAGE_MESSAGES: 1n << 13n,
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
};

export const RolesManager: React.FC = () => {
  const currentServer = useServerStore(state => state.currentServer);
  const updateGuild = useServerStore(state => state.updateGuild);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  if (!currentServer) return null;

  const roles = (currentServer as any).roles || [];
  const selectedRole = roles.find((r: Role) => r.id === selectedRoleId);

  const handleUpdateRole = async (roleId: string, updates: Partial<Role>) => {
    const newRoles = roles.map((r: Role) => r.id === roleId ? { ...r, ...updates } : r);
    await updateGuild(currentServer.id, { roles: newRoles } as any);
  };

  const handleTogglePermission = (role: Role, permission: bigint) => {
    const currentPerms = BigInt(role.permissions || '0');
    const newPerms = (currentPerms & permission) ? (currentPerms ^ permission) : (currentPerms | permission);
    handleUpdateRole(role.id, { permissions: newPerms.toString() });
  };

  return (
    <div className={styles.rolesManager}>
      <div className={styles.roleList}>
        {roles.map((role: Role) => (
          <div 
            key={role.id} 
            className={`${styles.roleItem} ${selectedRoleId === role.id ? styles.active : ''}`}
            onClick={() => setSelectedRoleId(role.id)}
            style={{ borderLeftColor: role.color || '#99aab5' }}
          >
            {role.name}
          </div>
        ))}
      </div>

      <div className={styles.roleDetails}>
        {selectedRole ? (
          <>
            <div className={styles.section}>
              <label>Role Name</label>
              <input 
                type="text" 
                className={styles.roleNameInput}
                value={selectedRole.name}
                onChange={(e) => handleUpdateRole(selectedRole.id, { name: e.target.value })}
              />
            </div>

            <div className={styles.section}>
              <label>Permissions</label>
              <div className={styles.permissionList}>
                {Object.entries(PermissionFlags).map(([name, flag]) => (
                  <div key={name} className={styles.permissionItem}>
                    <span>{name.replace(/_/g, ' ')}</span>
                    <input 
                      type="checkbox"
                      checked={!!(BigInt(selectedRole.permissions || '0') & flag)}
                      onChange={() => handleTogglePermission(selectedRole, flag)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>Select a role to edit</div>
        )}
      </div>
    </div>
  );
};
