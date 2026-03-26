/**
 * avatarUtils.ts
 * 
 * Pure client-side avatar gradient generator.
 * No external services. No DiceBear. No network requests.
 * 
 * Usage:
 *   import { getAvatarGradient, getInitials } from '../utils/avatarUtils'
 *   const { background } = getAvatarGradient('John')
 *   const letters = getInitials('John Doe') // "JD"
 */

const GRADIENTS = [
    'linear-gradient(135deg, var(--beacon-brand) 0%, #7289da 100%)',
    'linear-gradient(135deg, var(--status-success) 0%, #1f8c4e 100%)',
    'linear-gradient(135deg, #f0b232 0%, #e67e22 100%)',
    'linear-gradient(135deg, var(--status-error) 0%, #c0392b 100%)',
    'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
    'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
    'linear-gradient(135deg, #e91e8c 0%, #c2185b 100%)',
    'linear-gradient(135deg, #ff6b35 0%, #e55116 100%)',
    'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
    'linear-gradient(135deg, #e74c3c 0%, #922b21 100%)',
]

function hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i)
        hash |= 0
    }
    return Math.abs(hash)
}

export function getAvatarGradient(name: string): { background: string; color: string } {
    if (!name) return { background: GRADIENTS[0], color: '#fff' }
    return {
        background: GRADIENTS[hashString(name) % GRADIENTS.length],
        color: '#fff',
    }
}

export function getInitials(name?: string | null): string {
    if (!name || name.trim() === '') return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.substring(0, 2).toUpperCase()
}

/**
 * Returns inline style object for a gradient avatar container
 */
export function avatarStyle(name: string, size = 36): React.CSSProperties {
    const { background, color } = getAvatarGradient(name)
    return {
        width: size,
        height: size,
        minWidth: size,
        borderRadius: '50%',
        background,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: Math.max(10, size * 0.38),
        userSelect: 'none',
    }
}
