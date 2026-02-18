import { Crown, Shield, User } from 'lucide-react'
import { useServerStore } from '../../stores/useServerStore'
import { useUIStore } from '../../stores/useUIStore'
import styles from './MemberList.module.css'

function getStatusClass(status?: string) {
  switch (status) {
    case 'online': return styles.online
    case 'idle': return styles.idle
    case 'dnd': return styles.dnd
    default: return styles.offline
  }
}

function MemberRow({ member, isOwner }: { member: any; isOwner: boolean }) {
  const avatar = member.avatar || member.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.userId || member.id}`
  const username = member.username || member.user?.username || member.nickname || member.userId || 'Unknown'
  const status = member.status || member.user?.status || 'offline'
  const setSelectedUser = useUIStore(state => state.setSelectedUser)
  const setShowUserProfile = useUIStore(state => state.setShowUserProfile)

  return (
    <button
      className={styles.memberRow}
      onClick={() => {
        setSelectedUser(member.userId || member.id)
        setShowUserProfile(true)
      }}
    >
      <div className={styles.avatarWrap}>
        <img src={avatar} alt={username} className={styles.avatar} />
        <span className={`${styles.statusDot} ${getStatusClass(status)}`} />
      </div>
      <div className={styles.memberInfo}>
        <span className={styles.memberName}>{username}</span>
        {member.customStatus && (
          <span className={styles.customStatus}>{member.customStatus}</span>
        )}
      </div>
      <div className={styles.badges}>
        {isOwner && <Crown size={13} className={styles.ownerBadge} title="Server Owner" />}
        {!isOwner && member.roles?.length > 0 && <Shield size={13} className={styles.roleBadge} title={member.roles[0]?.name} />}
      </div>
    </button>
  )
}

export function MemberList() {
  const currentServer = useServerStore(state => state.currentServer)

  const members: any[] = currentServer?.members || []
  const ownerId = currentServer?.ownerId || ''

  const onlineMembers = members.filter(m => {
    const s = m.status || m.user?.status
    return s === 'online' || s === 'idle' || s === 'dnd'
  })
  const offlineMembers = members.filter(m => {
    const s = m.status || m.user?.status
    return !s || s === 'offline' || s === 'invisible'
  })

  return (
    <div className={styles.memberList}>
      <div className={styles.header}>
        Members — {members.length}
      </div>

      <div className={styles.scrollArea}>
        {onlineMembers.length > 0 && (
          <div className={styles.group}>
            <div className={styles.groupLabel}>ONLINE — {onlineMembers.length}</div>
            {onlineMembers.map(m => (
              <MemberRow key={m.userId || m.id} member={m} isOwner={(m.userId || m.id) === ownerId} />
            ))}
          </div>
        )}

        {offlineMembers.length > 0 && (
          <div className={styles.group}>
            <div className={styles.groupLabel}>OFFLINE — {offlineMembers.length}</div>
            {offlineMembers.map(m => (
              <MemberRow key={m.userId || m.id} member={m} isOwner={(m.userId || m.id) === ownerId} />
            ))}
          </div>
        )}

        {members.length === 0 && (
          <div className={styles.empty}>
            <User size={32} className={styles.emptyIcon} />
            <span>No members found</span>
          </div>
        )}
      </div>
    </div>
  )
}
