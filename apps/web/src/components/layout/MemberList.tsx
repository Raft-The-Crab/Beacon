import { Crown, Shield, User, Users } from 'lucide-react'
import { GroupedVirtuoso } from 'react-virtuoso'
import { useServerStore } from '../../stores/useServerStore'
import { useUIStore } from '../../stores/useUIStore'
import { Avatar } from '../ui/Avatar'
import styles from '../../styles/modules/layout/MemberList.module.css'



function MemberRow({ member, isOwner }: { member: any; isOwner: boolean }) {
  const username = member.username || member.user?.username || member.nickname || member.userId || 'Unknown'
  const status = member.status || member.user?.status || 'offline'
  const avatar = member.avatar || member.user?.avatar
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
        <Avatar
          src={avatar}
          username={username}
          status={status as any}
          size="sm"
        />
      </div>
      <div className={styles.memberInfo}>
        <span className={styles.memberName}>{username}</span>
        {(member.customStatus || member.user?.customStatus) && (
          <span className={styles.customStatus}>{member.customStatus || member.user?.customStatus}</span>
        )}
      </div>
      <div className={styles.badges}>
        {isOwner && <div title="Server Owner"><Crown size={13} className={styles.ownerBadge} /></div>}
        {!isOwner && (member.roles?.length ?? 0) > 0 && <Shield size={13} className={styles.roleBadge} />}
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
      <header className={styles.header}>
        <Users size={14} className={styles.headerIcon} />
        <h3 className={styles.title}>Members — {members.length}</h3>
      </header>

      <div className={styles.scrollArea}>
        {members.length === 0 ? (
          <div className={styles.empty}>
            <User size={32} className={styles.emptyIcon} />
            <span>No members found</span>
          </div>
        ) : (
          <GroupedVirtuoso
            groupCounts={[onlineMembers.length, offlineMembers.length].filter(Boolean)}
            groupContent={(index) => {
              if (onlineMembers.length > 0 && index === 0) return <div className={styles.groupLabel}>ONLINE — {onlineMembers.length}</div>
              return <div className={styles.groupLabel}>OFFLINE — {offlineMembers.length}</div>
            }}
            itemContent={(index, groupIndex) => {
              const memberList = (onlineMembers.length > 0 && groupIndex === 0) ? onlineMembers : offlineMembers
              // Need to correct the index since Virtuoso itemContent index is absolute, not relative to the group
              const localIndex = index - (groupIndex === 0 ? 0 : onlineMembers.length)
              const m = memberList[localIndex]
              if (!m) return null
              return <MemberRow key={m.userId || m.id} member={m} isOwner={(m.userId || m.id) === ownerId} />
            }}
          />
        )}
      </div>
    </div>
  )
}
