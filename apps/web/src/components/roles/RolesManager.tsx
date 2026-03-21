import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServerStore } from '../../stores/useServerStore';
import type { Role, Permission } from 'beacon-sdk'
import { PermissionBit } from 'beacon-sdk'
import styles from '../../styles/modules/roles/RolesManager.module.css';

// We use PermissionBit directly from beacon-sdk
const PermissionFlags = PermissionBit;

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
    // If Admin is enabled, we could warn that it overrides all, but standard bitwise is fine
    const newPerms = (currentPerms & permission) ? (currentPerms ^ permission) : (currentPerms | permission);
    handleUpdateRole(role.id, { permissions: newPerms.toString() });
  };

  const handleReorder = async (roleId: string, direction: 'up' | 'down') => {
    const index = roles.findIndex((r: Role) => r.id === roleId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === roles.length - 1) return;

    const newRoles = [...roles];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newRoles[index], newRoles[swapIndex]] = [newRoles[swapIndex], newRoles[index]];

    // Update positions based on order
    const updatedRoles = newRoles.map((r, i) => ({ ...r, position: newRoles.length - 1 - i }));
    await updateGuild(currentServer.id, { roles: updatedRoles } as any);
  };

  return (
    <div className={styles.rolesManager}>
      <div className={styles.roleList}>
        <div className={styles.listHeader}>
          <span>ROLES</span>
          <button className={styles.addRoleBtn}>+</button>
        </div>
        <AnimatePresence>
          {roles.map((role: Role, idx: number) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: Math.min(idx * 0.03, 0.3), type: 'spring', damping: 25, stiffness: 300 }}
              key={role.id}
              className={`${styles.roleItem} ${selectedRoleId === role.id ? styles.active : ''}`}
              onClick={() => setSelectedRoleId(role.id)}
            >
              <div className={styles.roleColorDot} style={{ background: role.color || '#99aab5' }} />
              <span className={styles.roleNameText}>{role.name}</span>
              <div className={styles.reorderBtns}>
                <button onClick={(e) => { e.stopPropagation(); handleReorder(role.id, 'up') }} disabled={idx === 0}>↑</button>
                <button onClick={(e) => { e.stopPropagation(); handleReorder(role.id, 'down') }} disabled={idx === roles.length - 1}>↓</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className={styles.roleDetails}>
        {selectedRole ? (
          <motion.div 
            key={selectedRole.id}
            className={styles.scrollArea}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className={styles.detailHeader}>
              <h2>Edit Role — {selectedRole.name}</h2>
              <div className={styles.dangerZone}>
                <button className={styles.deleteRoleBtn}>Delete Role</button>
              </div>
            </div>

            <div className={styles.tabs}>
              <button className={styles.tabActive}>Display</button>
              <button>Permissions</button>
              <button>Members</button>
            </div>

            <div className={styles.section}>
              <label>ROLE NAME</label>
              <input
                type="text"
                className={styles.roleNameInput}
                value={selectedRole.name}
                onChange={(e) => handleUpdateRole(selectedRole.id, { name: e.target.value })}
              />
            </div>

            <div className={styles.section}>
              <label>ROLE COLOR</label>
              <div className={styles.colorConfig}>
                <input
                  type="color"
                  value={selectedRole.color || '#99aab5'}
                  onChange={(e) => handleUpdateRole(selectedRole.id, { color: e.target.value })}
                />
                <div className={styles.colorPresets}>
                  {['#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#e91e63', '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6', '#607d8b'].map(c => (
                    <div
                      key={c}
                      className={styles.colorPreset}
                      style={{ background: c }}
                      onClick={() => handleUpdateRole(selectedRole.id, { color: c })}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <label>PERMISSIONS</label>
              <p className={styles.sectionDesc}>Control what members with this role can do.</p>
              <div className={styles.permissionList}>
                {Object.entries(PermissionFlags).map(([name, flag]) => (
                  <div key={name} className={styles.permissionItem}>
                    <div className={styles.permText}>
                      <span className={styles.permName}>{name.replace(/_/g, ' ')}</span>
                    </div>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={!!(BigInt(selectedRole.permissions || '0') & flag)}
                        onChange={() => handleTogglePermission(selectedRole, flag)}
                      />
                      <span className={styles.slider} />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className={styles.emptyState}>
            <img src="/assets/illustrations/roles.svg" alt="" className={styles.emptyImg} onError={(e) => e.currentTarget.style.display = 'none'} />
            <p>Select a role from the left to start configuring permissions and appearance.</p>
          </div>
        )}
      </div>
    </div>
  );
};
