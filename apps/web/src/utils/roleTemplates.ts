import { Permission } from '../stores/useRolesStore'

export interface RoleTemplate {
  id: string
  name: string
  description: string
  icon: string
  color: string
  permissions: Permission[]
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full server control with all permissions',
    icon: 'Crown',
    color: '#e74c3c',
    permissions: ['ADMINISTRATOR']
  },
  {
    id: 'moderator',
    name: 'Moderator',
    description: 'Manage messages, kick/ban members, and moderate chat',
    icon: 'Shield',
    color: '#3498db',
    permissions: [
      'MANAGE_MESSAGES',
      'KICK_MEMBERS',
      'BAN_MEMBERS',
      'MANAGE_NICKNAMES',
      'MUTE_MEMBERS',
      'DEAFEN_MEMBERS',
      'MOVE_MEMBERS',
      'VIEW_CHANNELS',
      'SEND_MESSAGES'
    ]
  },
  {
    id: 'support',
    name: 'Support Team',
    description: 'Help members and manage tickets',
    icon: 'Users',
    color: '#2ecc71',
    permissions: [
      'VIEW_CHANNELS',
      'SEND_MESSAGES',
      'EMBED_LINKS',
      'ATTACH_FILES',
      'MANAGE_MESSAGES',
      'MENTION_EVERYONE',
      'CONNECT_VOICE',
      'SPEAK_VOICE',
      'PRIORITY_SPEAKER'
    ]
  },
  {
    id: 'vip',
    name: 'VIP',
    description: 'Premium members with enhanced permissions',
    icon: 'Star',
    color: '#f39c12',
    permissions: [
      'VIEW_CHANNELS',
      'SEND_MESSAGES',
      'EMBED_LINKS',
      'ATTACH_FILES',
      'ADD_REACTIONS',
      'USE_EXTERNAL_EMOJIS',
      'CONNECT_VOICE',
      'SPEAK_VOICE',
      'USE_VOICE_ACTIVITY',
      'CREATE_INVITE'
    ]
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Technical team with bot and webhook management',
    icon: 'Code',
    color: '#9b59b6',
    permissions: [
      'VIEW_CHANNELS',
      'SEND_MESSAGES',
      'EMBED_LINKS',
      'ATTACH_FILES',
      'MANAGE_WEBHOOKS',
      'CONNECT_VOICE',
      'SPEAK_VOICE'
    ]
  },
  {
    id: 'content-creator',
    name: 'Content Creator',
    description: 'Create and share media content',
    icon: 'Video',
    color: '#e67e22',
    permissions: [
      'VIEW_CHANNELS',
      'SEND_MESSAGES',
      'EMBED_LINKS',
      'ATTACH_FILES',
      'USE_EXTERNAL_EMOJIS',
      'CONNECT_VOICE',
      'SPEAK_VOICE',
      'PRIORITY_SPEAKER',
      'CREATE_INVITE'
    ]
  },
  {
    id: 'member',
    name: 'Member',
    description: 'Basic member permissions',
    icon: 'UserCheck',
    color: '#95a5a6',
    permissions: [
      'VIEW_CHANNELS',
      'SEND_MESSAGES',
      'EMBED_LINKS',
      'ATTACH_FILES',
      'ADD_REACTIONS',
      'CONNECT_VOICE',
      'SPEAK_VOICE',
      'USE_VOICE_ACTIVITY'
    ]
  },
  {
    id: 'read-only',
    name: 'Read-Only',
    description: 'Can only view channels without posting',
    icon: 'Eye',
    color: '#7f8c8d',
    permissions: ['VIEW_CHANNELS']
  },
  {
    id: 'bot',
    name: 'Bot',
    description: 'Automated bot account',
    icon: 'Settings',
    color: '#34495e',
    permissions: [
      'VIEW_CHANNELS',
      'SEND_MESSAGES',
      'EMBED_LINKS',
      'ATTACH_FILES',
      'ADD_REACTIONS',
      'USE_EXTERNAL_EMOJIS',
      'MANAGE_MESSAGES',
      'CONNECT_VOICE',
      'SPEAK_VOICE'
    ]
  },
  {
    id: 'music-bot',
    name: 'Music Bot',
    description: 'Music playback bot with voice permissions',
    icon: 'Music',
    color: '#1abc9c',
    permissions: [
      'VIEW_CHANNELS',
      'SEND_MESSAGES',
      'EMBED_LINKS',
      'CONNECT_VOICE',
      'SPEAK_VOICE',
      'USE_VOICE_ACTIVITY'
    ]
  },
  {
    id: 'event-organizer',
    name: 'Event Organizer',
    description: 'Plan and host server events',
    icon: 'Calendar',
    color: '#16a085',
    permissions: [
      'VIEW_CHANNELS',
      'SEND_MESSAGES',
      'EMBED_LINKS',
      'ATTACH_FILES',
      'MENTION_EVERYONE',
      'CREATE_INVITE',
      'MANAGE_CHANNELS',
      'CONNECT_VOICE',
      'SPEAK_VOICE',
      'MOVE_MEMBERS',
      'PRIORITY_SPEAKER'
    ]
  },
  {
    id: 'trial-moderator',
    name: 'Trial Moderator',
    description: 'Trainee moderator with limited permissions',
    icon: 'Award',
    color: '#27ae60',
    permissions: [
      'VIEW_CHANNELS',
      'SEND_MESSAGES',
      'MANAGE_MESSAGES',
      'KICK_MEMBERS',
      'CONNECT_VOICE',
      'SPEAK_VOICE',
      'MUTE_MEMBERS'
    ]
  }
]

/**
 * Get a role template by ID
 */
export function getRoleTemplate(id: string): RoleTemplate | undefined {
  return ROLE_TEMPLATES.find((template) => template.id === id)
}

/**
 * Search role templates
 */
export function searchRoleTemplates(query: string): RoleTemplate[] {
  const lowerQuery = query.toLowerCase()
  return ROLE_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get templates by category
 */
export function getRoleTemplatesByCategory(category: 'management' | 'members' | 'bots'): RoleTemplate[] {
  const categories = {
    management: ['admin', 'moderator', 'trial-moderator', 'support', 'event-organizer'],
    members: ['vip', 'member', 'content-creator', 'developer', 'read-only'],
    bots: ['bot', 'music-bot']
  }

  return ROLE_TEMPLATES.filter((template) => categories[category].includes(template.id))
}
