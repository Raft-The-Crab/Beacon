// Premium Cosmetics System

export const COSMETICS = {
  // Profile Effects (5 Launch Cosmetics)
  COSMIC_AURA: {
    id: 'cosmic_aura',
    name: 'Cosmic Aura',
    description: 'Animated galaxy particles around your avatar',
    price: 500,
    type: 'profile_effect',
    rarity: 'legendary',
    animation: 'cosmic-particles',
    preview: '/cosmetics/cosmic-aura.gif'
  },
  
  NEON_GLOW: {
    id: 'neon_glow',
    name: 'Neon Glow',
    description: 'Pulsing neon outline with RGB colors',
    price: 300,
    type: 'profile_effect',
    rarity: 'epic',
    animation: 'neon-pulse',
    preview: '/cosmetics/neon-glow.gif'
  },
  
  FIRE_RING: {
    id: 'fire_ring',
    name: 'Fire Ring',
    description: 'Blazing fire circle animation',
    price: 400,
    type: 'profile_effect',
    rarity: 'epic',
    animation: 'fire-ring',
    preview: '/cosmetics/fire-ring.gif'
  },
  
  SNOW_FALL: {
    id: 'snow_fall',
    name: 'Snow Fall',
    description: 'Gentle snowflakes falling around profile',
    price: 250,
    type: 'profile_effect',
    rarity: 'rare',
    animation: 'snow-particles',
    preview: '/cosmetics/snow-fall.gif'
  },
  
  LIGHTNING_STRIKE: {
    id: 'lightning_strike',
    name: 'Lightning Strike',
    description: 'Electric bolts crackling around avatar',
    price: 450,
    type: 'profile_effect',
    rarity: 'epic',
    animation: 'lightning-bolts',
    preview: '/cosmetics/lightning.gif'
  }
}

// Custom Name Fonts
export const NAME_FONTS = {
  DEFAULT: {
    id: 'default',
    name: 'Default',
    font: 'Inter, sans-serif',
    price: 0,
    preview: 'Username'
  },
  
  CYBERPUNK: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    font: '"Orbitron", monospace',
    price: 200,
    preview: '𝚄𝚜𝚎𝚛𝚗𝚊𝚖𝚎',
    beaconPlusOnly: false
  },
  
  ELEGANT: {
    id: 'elegant',
    name: 'Elegant Script',
    font: '"Playfair Display", serif',
    price: 200,
    preview: '𝒰𝓈ℯ𝓇𝓃𝒶𝓂ℯ',
    beaconPlusOnly: false
  },
  
  BOLD_IMPACT: {
    id: 'bold',
    name: 'Bold Impact',
    font: '"Impact", sans-serif',
    price: 150,
    preview: '𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲',
    beaconPlusOnly: false
  },
  
  RETRO_PIXEL: {
    id: 'pixel',
    name: 'Retro Pixel',
    font: '"Press Start 2P", monospace',
    price: 250,
    preview: 'Ｕｓｅｒｎａｍｅ',
    beaconPlusOnly: false
  },
  
  GLITCH: {
    id: 'glitch',
    name: 'Glitch',
    font: '"Courier New", monospace',
    price: 300,
    preview: 'U̷s̷e̷r̷n̷a̷m̷e̷',
    beaconPlusOnly: false,
    effect: 'glitch-text'
  },
  
  RAINBOW: {
    id: 'rainbow',
    name: 'Rainbow',
    font: '"Comic Sans MS", cursive',
    price: 350,
    preview: 'Username',
    beaconPlusOnly: false,
    effect: 'rainbow-gradient'
  },
  
  GOLD_SHINE: {
    id: 'gold',
    name: 'Gold Shine',
    font: '"Georgia", serif',
    price: 400,
    preview: 'Username',
    beaconPlusOnly: false,
    effect: 'gold-shimmer'
  }
}

// CSS for cosmetic effects
export const COSMETIC_CSS = `
/* Cosmic Aura */
@keyframes cosmic-particles {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0; }
  50% { opacity: 1; }
}

.cosmic-particles::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, #6366f1 0%, transparent 70%);
  animation: cosmic-particles 3s infinite;
}

/* Neon Glow */
@keyframes neon-pulse {
  0%, 100% { box-shadow: 0 0 5px #00ff88, 0 0 10px #00ff88; }
  50% { box-shadow: 0 0 20px #00ff88, 0 0 30px #00ff88, 0 0 40px #00ff88; }
}

.neon-pulse {
  animation: neon-pulse 2s infinite;
}

/* Fire Ring */
@keyframes fire-ring {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
}

.fire-ring::after {
  content: '🔥';
  position: absolute;
  animation: fire-ring 3s linear infinite;
}

/* Glitch Text */
@keyframes glitch-text {
  0% { text-shadow: 2px 0 #ff0000; }
  25% { text-shadow: -2px 0 #00ff00; }
  50% { text-shadow: 2px 0 #0000ff; }
  75% { text-shadow: -2px 0 #ff00ff; }
  100% { text-shadow: 2px 0 #ff0000; }
}

.glitch-text {
  animation: glitch-text 0.3s infinite;
}

/* Rainbow Gradient */
@keyframes rainbow-gradient {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.rainbow-gradient {
  background: linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: rainbow-gradient 3s linear infinite;
}

/* Gold Shimmer */
@keyframes gold-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.gold-shimmer {
  background: linear-gradient(90deg, #d4af37 0%, #ffd700 50%, #d4af37 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gold-shimmer 3s linear infinite;
}
`

export interface UserCosmetics {
  profileEffect?: string
  nameFont?: string
  nameFontEffect?: string
  ownedCosmetics: string[]
}
