import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Crown, EllipsisVertical, Shield, User, Users } from 'lucide-react'
import { PermissionBit } from '@beacon/types'
import { useServerStore } from '../../stores/useServerStore'
import { useUIStore } from '../../stores/useUIStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { apiClient } from '../../services/apiClient'
import { Avatar } from '../ui/Avatar'
import { useToast } from '../ui'
import styles from '../../styles/modules/layout/MemberList.module.css'

interface NormalizedMember {
  id: string
  username: string
  avatar?: string | null
  status: string
  customStatus?: string | null
  roles: { name: string; color?: string | null; permissions?: string | number | bigint | null }[]
}

const STAFF_PERMISSIONS = [
  PermissionBit.ADMINISTRATOR,
  PermissionBit.MANAGE_SERVER,
  PermissionBit.MANAGE_ROLES,
  PermissionBit.KICK_MEMBERS,
  PermissionBit.BAN_MEMBERS,
]

function hasStaffPrivileges(roles: { name: string; color?: string | null; permissions?: string | number | bigint | null }[]) {
  return roles.some((role) => {
    const permissions = role?.permissions
    if (permissions !== null && permissions !== undefined) {
      try {
        const bitfield = BigInt(permissions)
        if (STAFF_PERMISSIONS.some((perm) => (bitfield & perm) !== 0n)) {
          return true
        }
      } catch {
        // Fall through to name check when permission value isn't parseable.
      }
    }

    return /admin|mod|moderator|staff/i.test(String(role?.name || ''))
  })
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
          permissions: role?.permissions ?? null,
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

function MemberRow({
  member,
  isOwner,
  isStaff,
  onOpenProfile,
  onOpenContextMenu,
}: {
  member: NormalizedMember
  isOwner: boolean
  isStaff: boolean
  onOpenProfile: (member: NormalizedMember) => void
  onOpenContextMenu: (member: NormalizedMember, position?: { left: number; top: number }) => void
}) {
  const rowRef = useRef<HTMLButtonElement>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggeredRef = useRef(false)

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const getFallbackPosition = () => {
    const rect = rowRef.current?.getBoundingClientRect()
    if (!rect) return undefined

    return {
      left: rect.right - 12,
      top: rect.top + Math.min(rect.height / 2, 24),
    }
  }

  const openActions = (position?: { left: number; top: number }) => {
    longPressTriggeredRef.current = true
    onOpenContextMenu(member, position || getFallbackPosition())
  }

  const handleClick = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false
      return
    }

    onOpenProfile(member)
  }

  const handleContextMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    clearLongPress()
    onOpenContextMenu(member, { left: event.clientX, top: event.clientY })
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'touch') return

    longPressTriggeredRef.current = false
    clearLongPress()
    longPressTimerRef.current = setTimeout(() => {
      openActions(getFallbackPosition())
    }, 420)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      event.preventDefault()
      openActions(getFallbackPosition())
    }
  }

  useEffect(() => () => clearLongPress(), [])

  return (
    <div className={styles.memberRowShell}>
      <button
        ref={rowRef}
        className={styles.memberRow}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerUp={clearLongPress}
        onPointerCancel={clearLongPress}
        onPointerLeave={clearLongPress}
        onPointerMove={clearLongPress}
        onKeyDown={handleKeyDown}
        aria-label={`View profile for ${member.username}`}
        aria-keyshortcuts="Shift+F10"
        title="Open profile. Right-click, press and hold, or press Shift+F10 for member actions."
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
          {!isOwner && isStaff && <span title="Staff"><Shield size={13} className={styles.roleBadge} /></span>}
        </div>
      </button>
      <button
        type="button"
        className={styles.memberActionTrigger}
        onClick={(event) => {
          event.stopPropagation()
          clearLongPress()
          openActions(getFallbackPosition())
        }}
        aria-label={`Open member actions for ${member.username}`}
        title="Open member actions"
      >
        <EllipsisVertical size={16} />
      </button>
    </div>
  )
}

export function MemberList() {
  const currentServer = useServerStore(state => state.currentServer)
  const { user } = useAuthStore()
  const setSelectedUser = useUIStore(state => state.setSelectedUser)
  const setShowUserProfile = useUIStore(state => state.setShowUserProfile)
  const { show } = useToast()
  const [hydratedMembers, setHydratedMembers] = useState<any[]>([])
  const [isModerating, setIsModerating] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    member: NormalizedMember
    top: number
    left: number
  } | null>(null)

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
  const currentMember = members.find((member) => member.id === user?.id)
  const viewerIsOwner = !!user && ownerId === user.id
  const viewerIsStaff = viewerIsOwner || hasStaffPrivileges(currentMember?.roles || [])
  const onlineMembers = members.filter((member) => ['online', 'idle', 'dnd'].includes(member.status))
  const offlineMembers = members.filter((member) => !['online', 'idle', 'dnd'].includes(member.status))
  const sections = [
    { label: 'Online', members: onlineMembers },
    { label: 'Offline', members: offlineMembers },
  ].filter((section) => section.members.length > 0)

  const openProfile = (member: NormalizedMember) => {
    setSelectedUser(member.id)
    setShowUserProfile(true)
  }

  const canModerateTarget = (member: NormalizedMember) => {
    const targetIsOwner = member.id === ownerId
    const targetIsSelf = member.id === user?.id
    return viewerIsStaff && !targetIsOwner && !targetIsSelf
  }

  useEffect(() => {
    if (!contextMenu) return

    const close = () => setContextMenu(null)
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContextMenu(null)
    }

    document.addEventListener('click', close)
    document.addEventListener('scroll', close, true)
    document.addEventListener('keydown', onEsc)

    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('scroll', close, true)
      document.removeEventListener('keydown', onEsc)
    }
  }, [contextMenu])

  const openContextMenu = (member: NormalizedMember, position?: { left: number; top: number }) => {
    const menuWidth = 216
    const menuHeight = 160
    const viewportPad = 10
    const clientX = position?.left ?? window.innerWidth / 2
    const clientY = position?.top ?? window.innerHeight / 2
    const left = Math.max(viewportPad, Math.min(clientX, window.innerWidth - menuWidth - viewportPad))
    const top = Math.max(viewportPad, Math.min(clientY, window.innerHeight - menuHeight - viewportPad))
    setContextMenu({ member, top, left })
  }

  const runKick = async (member: NormalizedMember) => {
    if (!currentServer?.id || !member?.id || !canModerateTarget(member)) return
    if (!window.confirm(`Kick ${member.username} from this server?`)) return

    setIsModerating(true)
    try {
      const result = await apiClient.kickMember(currentServer.id, member.id)
      if (!result.success) {
        show(result.error || 'Failed to kick member', 'error')
        return
      }

      setHydratedMembers((prev) => prev.filter((entry: any) => {
        const id = entry?.userId || entry?.user?.id || entry?.id
        return id !== member.id
      }))
      show('Member kicked', 'success')
    } catch {
      show('Failed to kick member', 'error')
    } finally {
      setIsModerating(false)
    }
  }

  const runBan = async (member: NormalizedMember) => {
    if (!currentServer?.id || !member?.id || !canModerateTarget(member)) return
    const reason = window.prompt(`Ban reason for ${member.username} (optional):`) || undefined
    if (!window.confirm(`Ban ${member.username} from this server?`)) return

    setIsModerating(true)
    try {
      const result = await apiClient.banMember(currentServer.id, member.id, reason)
      if (!result.success) {
        show(result.error || 'Failed to ban member', 'error')
        return
      }

      setHydratedMembers((prev) => prev.filter((entry: any) => {
        const id = entry?.userId || entry?.user?.id || entry?.id
        return id !== member.id
      }))
      show('Member banned', 'success')
    } catch {
      show('Failed to ban member', 'error')
    } finally {
      setIsModerating(false)
    }
  }

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
                  <MemberRow
                    key={member.id}
                    member={member}
                    isOwner={member.id === ownerId}
                    isStaff={hasStaffPrivileges(member.roles)}
                    onOpenProfile={openProfile}
                    onOpenContextMenu={openContextMenu}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ top: contextMenu.top, left: contextMenu.left }}
          role="menu"
          aria-label={`Member moderation for ${contextMenu.member.username}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className={styles.contextHeader}>{contextMenu.member.username}</div>
          <button
            className={styles.contextAction}
            onClick={() => {
              openProfile(contextMenu.member)
              setContextMenu(null)
            }}
            role="menuitem"
          >
            View Profile
          </button>
          {!canModerateTarget(contextMenu.member) && (
            <div className={styles.contextNote}>No moderation permissions for this member.</div>
          )}
          <button
            className={`${styles.contextAction} ${styles.contextWarn}`}
            onClick={() => {
              if (canModerateTarget(contextMenu.member)) {
                void runKick(contextMenu.member)
                setContextMenu(null)
              }
            }}
            disabled={isModerating || !canModerateTarget(contextMenu.member)}
            role="menuitem"
          >
            Kick Member
          </button>
          <button
            className={`${styles.contextAction} ${styles.contextDanger}`}
            onClick={() => {
              if (canModerateTarget(contextMenu.member)) {
                void runBan(contextMenu.member)
                setContextMenu(null)
              }
            }}
            disabled={isModerating || !canModerateTarget(contextMenu.member)}
            role="menuitem"
          >
            Ban Member
          </button>
        </div>
      )}
    </div>
  )
}
