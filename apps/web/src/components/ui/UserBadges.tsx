import React from 'react'
import type { UserBadge } from '@beacon/types'
import styles from '../../styles/modules/ui/UserBadges.module.css'

// ── CUSTOM SVG BADGE COMPONENTS (God-Tier Aesthetics) ──

const CrownSVG = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V17H2V19ZM2.2 14.5L5.4 15.3L8.5 7.5L12 14L15.5 7.5L18.6 15.3L21.8 14.5L19.5 4L15.5 5.5L12 2L8.5 5.5L4.5 4L2.2 14.5Z" fill="#FEE75C" stroke="#B8860B" strokeWidth="1" />
    <circle cx="12" cy="10" r="1.5" fill="#FFF" />
    <circle cx="8" cy="11.5" r="1" fill="#FFF" />
    <circle cx="16" cy="11.5" r="1" fill="#FFF" />
  </svg>
)

const AdminShieldSVG = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C12 2 4 5 4 10C4 16.5 12 22 12 22C12 22 20 16.5 20 10C20 5 12 2 12 2Z" fill="#ED4245" />
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C12 2 4 5 4 10C4 16.5 12 22 12 22V2Z" fill="#DA373C" />
    <path d="M12 6L13.5 10.5H18L14.5 13L16 17.5L12 15L8 17.5L9.5 13L6 10.5H10.5L12 6Z" fill="#FFF" />
  </svg>
)

const ModShieldSVG = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C12 2 4 5 4 10C4 16.5 12 22 12 22C12 22 20 16.5 20 10C20 5 12 2 12 2Z" fill="#5865F2" />
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C12 2 4 5 4 10C4 16.5 12 22 12 22V2Z" fill="#4752C4" />
    <path d="M10 15L7 12L8.5 10.5L10 12L15.5 6.5L17 8L10 15Z" fill="#FFF" />
  </svg>
)

const SparklesSVG = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.spinShimmer}>
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#EB459E" />
    <path d="M12 6L13.5 10.5H18L14.5 13L16 17.5L12 15L8 17.5L9.5 13L6 10.5H10.5L12 6Z" fill="#FFF" opacity="0.6" />
    <circle cx="5" cy="5" r="1.5" fill="#FFF" />
    <circle cx="19" cy="5" r="1" fill="#FFF" />
    <circle cx="19" cy="19" r="1.5" fill="#FFF" />
    <circle cx="5" cy="19" r="1" fill="#FFF" />
  </svg>
)

const BotSVG = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="16" height="12" rx="2" fill="#5865F2" />
    <path d="M8 6V4M16 6V4" stroke="#5865F2" strokeWidth="2" strokeLinecap="round" />
    <circle cx="9" cy="11" r="1.5" fill="#FFF" />
    <circle cx="15" cy="11" r="1.5" fill="#FFF" />
    <rect x="8" y="14" width="8" height="2" fill="#FFF" />
  </svg>
)

const StarSVG = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FEE75C" stroke="#DAA520" strokeWidth="1" />
    <circle cx="12" cy="12" r="3" fill="#FFF" opacity="0.5" />
  </svg>
)

const BugSVG = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 5C9.24 5 7 7.24 7 10V18C7 19.1 7.9 20 9 20H15C16.1 20 17 19.1 17 18V10C17 7.24 14.76 5 12 5ZM12 7C14.21 7 16 8.79 16 11H8C8 8.79 9.79 7 12 7Z" fill="#23A559" />
    <path d="M6 10H8V12H6V10ZM16 10H18V12H16V10ZM5 14H8V16H5V14ZM16 14H19V16H16V14ZM10 2H14V4H10V2ZM9 22H15V24H9V22Z" fill="#23A559" />
    <circle cx="10" cy="9" r="1" fill="#FFF" />
    <circle cx="14" cy="9" r="1" fill="#FFF" />
  </svg>
)

const PartnerSVG = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#EE1111" />
    <path d="M12 6L13.5 10.5H18L14.5 13L16 17.5L12 15L8 17.5L9.5 13L6 10.5H10.5L12 6Z" fill="#FFF" />
  </svg>
)

interface UserBadgesProps {
  badges?: UserBadge[]
  isBot?: boolean
  size?: 'sm' | 'md'
}

const BADGE_CONFIG: Record<UserBadge, { element: React.FC<{ size: number }>; label: string; className: string }> = {
  owner: { element: CrownSVG, label: 'Platform Owner', className: 'owner' },
  admin: { element: AdminShieldSVG, label: 'Admin', className: 'admin' },
  moderator: { element: ModShieldSVG, label: 'Platform Moderator', className: 'moderator' },
  beacon_plus: { element: SparklesSVG, label: 'Beacon+ Subscriber', className: 'beaconPlus' },
  bot: { element: BotSVG, label: 'Bot', className: 'bot' },
  early_supporter: { element: StarSVG, label: 'Early Supporter', className: 'earlySup' },
  bug_hunter: { element: BugSVG, label: 'Bug Hunter', className: 'bugHunter' },
  server_owner: { element: PartnerSVG, label: 'Server Owner', className: 'serverOwner' },
}

export function UserBadges({ badges = [], isBot, size = 'sm' }: UserBadgesProps) {
  const allBadges = [...badges]
  if (isBot && !allBadges.includes('bot')) allBadges.push('bot')
  if (allBadges.length === 0) return null

  return (
    <span className={`${styles.badges} ${styles[size]}`}>
      {allBadges.map((badge) => {
        const config = BADGE_CONFIG[badge]
        if (!config) return null
        const SvgIcon = config.element
        return (
          <span
            key={badge}
            className={`${styles.badge} ${styles[config.className]}`}
            title={config.label}
          >
            <SvgIcon size={size === 'sm' ? 16 : 22} />
          </span>
        )
      })}
    </span>
  )
}

/** Inline BOT tag (like Discord's "BOT" pill next to username) */
export function BotTag({ className }: { className?: string }) {
  return (
    <span className={`${styles.botTag} ${className || ''}`}>
      BOT
    </span>
  )
}
