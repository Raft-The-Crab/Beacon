import { useEffect, useMemo, useState } from 'react'
import { Crown, Shield, User, Users } from 'lucide-react'
import { useServerStore } from '../../stores/useServerStore'
import { useUIStore } from '../../stores/useUIStore'
import { apiClient } from '../../services/apiClient'
import { Avatar } from '../ui/Avatar'
import styles from '../../styles/modules/layout/MemberList.module.css'

interface NormalizedMember {
  id: string
  username: string
  avatar?: string | null
  status: string
  customStatus?: string | null
  roles: { name: string; color?: string | null }[]
}

function normalizeMember(member: any): NormalizedMember | null {
  const user = member?.user ?? member
  const id = member?.userId || user?.id || member?.id

  if (!id) return null

  const roles = Array.isArray(member?.roles)
    ? member.roles.map((role: any) => {
        if (typeof role === 'string') return { name: role, color: null }
        return {
          name: role?.name || 'Role',
          color: role?.color || null,
        }
      })
    : []

  return {
    id,
    username: user?.username || member?.nickname || id,
    avatar: user?.avatar || member?.avatar || null,
    status: member?.status || user?.status || 'offline',
    customStatus: member?.customStatus || user?.statusText || user?.customStatus || null,
    roles,
  }
}

function MemberRow({ member, isOwner }: { member: NormalizedMember; isOwner: boolean }) {
  const setSelectedUser = useUIStore(state => state.setSelectedUser)
  const setShowUserProfile = useUIStore(state => state.setShowUserProfile)

  return (
    <button
      className={styles.memberRow}
      onClick={() => {
        setSelectedUser(member.id)
        setShowUserProfile(true)
      }}
      aria-label={`View profile for ${member.username}`}
    >
      <div className={styles.avatarWrap}>
        <Avatar
          src={member.avatar}
          username={member.username}
          status={member.status as any}
          size="sm"
        />
      </div>
      <div className={styles.memberInfo}>
        <span className={styles.memberName}>{member.username}</span>
        {member.customStatus && (
          <span className={styles.customStatus}>{member.customStatus}</span>
        )}
      </div>
      <div className={styles.badges}>
        {isOwner && <div title="Server Owner"><Crown size={13} className={styles.ownerBadge} /></div>}
        {!isOwner && member.roles.length > 0 && <Shield size={13} className={styles.roleBadge} />}
      </div>
    </button>
  )
}

export function MemberList() {
  const currentServer = useServerStore(state => state.currentServer)
  const [hydratedMembers, setHydratedMembers] = useState<any[]>([])

  useEffect(() => {
    const seedMembers = Array.isArray(currentServer?.members) ? currentServer.members : []
    setHydratedMembers(seedMembers)

    if (!currentServer?.id) return

    let cancelled = false

    apiClient.getGuildMembers(currentServer.id)
      .then((res) => {
        if (!cancelled && res.success && Array.isArray(res.data)) {
          setHydratedMembers(res.data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHydratedMembers(seedMembers)
        }
      })

    return () => {
      cancelled = true
    }
  }, [currentServer?.id, currentServer?.members])

  const members = useMemo(
    () => hydratedMembers.map(normalizeMember).filter((member): member is NormalizedMember => !!member),
    [hydratedMembers],
  )

  const ownerId = currentServer?.ownerId || ''
  const onlineMembers = members.filter((member) => ['online', 'idle', 'dnd'].includes(member.status))
  const offlineMembers = members.filter((member) => !['online', 'idle', 'dnd'].includes(member.status))
  const sections = [
    { label: 'Online', members: onlineMembers },
    { label: 'Offline', members: offlineMembers },
  ].filter((section) => section.members.length > 0)

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
          sections.map((section) => (
            <section key={section.label} className={styles.group}>
              <div className={styles.groupLabel}>{section.label} — {section.members.length}</div>
              <div className={styles.groupList}>
                {section.members.map((member) => (
                  <MemberRow key={member.id} member={member} isOwner={member.id === ownerId} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
