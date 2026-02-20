// Beacon Economy System

export const BEACOIN_PRICES = {
  // Beacon+ Subscription (Includes ALL premium features)
  BEACON_PLUS: 750, // 1.5 months - Includes everything below
  
  // Server Boosting
  SERVER_BOOST: 50, // per boost
  
  // Individual purchases (if not subscribed to Beacon+)
  CUSTOM_THEME: 400,
  VANITY_URL: 300,
  CUSTOM_INVITE: 150,
  WELCOME_SCREEN: 200,
  DISCOVERY_BOOST: 400
}

export const BEACOIN_EARNING = {
  // Daily
  DAILY_LOGIN: 10,
  DAILY_STREAK_BONUS: 5, // per day streak
  
  // Activity
  MESSAGE_SENT: 1, // max 50/day
  VOICE_MINUTE: 2, // max 100/day
  REACTION_ADDED: 0.5, // max 20/day
  
  // Social
  INVITE_ACCEPTED: 50,
  FRIEND_ADDED: 10,
  SERVER_JOINED: 5,
  
  // Engagement
  POLL_CREATED: 5,
  POLL_VOTED: 1,
  THREAD_CREATED: 3,
  HELPFUL_REACTION: 2,
  
  // Special
  WEEKLY_CHALLENGE: 100,
  MONTHLY_BONUS: 200,
  LEVEL_UP: 25
}

// Max earnings per month: ~600 Beacoins
// Beacon+ costs 750 coins = 1.25 months of earning

export interface BeaconPlusFeatures {
  // Screen Sharing & Streaming
  screenShare4K: true
  screenShareFPS: 60
  hdStreaming: true
  priorityVoice: true
  
  // Uploads & Media
  maxUploadSize: 500 // MB (vs 25MB free)
  
  // Customization (ALL INCLUDED)
  animatedAvatar: true
  animatedEmoji: true
  customBanner: true
  customThemes: true // Unlimited
  profileEffects: true
  customTag: true
  
  // Emojis & Stickers
  customEmojis: 100 // vs 50 free
  animatedStickers: true
  
  // Perks
  premiumBadge: true
  prioritySupport: true
  earlyFeatures: true
  serverBoosts: 2 // 2 free boosts included
  
  // Quality of Life
  longerMessages: true // 4000 chars vs 2000
  moreReactions: true // Unlimited vs 20
  customStatus: true // Rich custom status
  
  // Server Features (when boosting)
  vanityURL: true
  customInvite: true
  welcomeScreen: true
  bannerBackground: true
}

export const FREE_FEATURES = {
  screenShare720p: true,
  screenShareFPS: 60,
  maxUploadSize: 25, // MB
  customEmojis: 50,
  basicThemes: 5,
  messageLength: 2000,
  reactions: 20
}

export function calculateMonthlyEarnings(): number {
  const daily = 
    BEACOIN_EARNING.DAILY_LOGIN + 
    (BEACOIN_EARNING.MESSAGE_SENT * 50) + 
    (BEACOIN_EARNING.VOICE_MINUTE * 50) + 
    (BEACOIN_EARNING.REACTION_ADDED * 20)
  
  const weekly = BEACOIN_EARNING.WEEKLY_CHALLENGE * 4
  const monthly = BEACOIN_EARNING.MONTHLY_BONUS
  
  return (daily * 30) + weekly + monthly // ~600 Beacoins/month
}

export function canAffordBeaconPlus(balance: number): boolean {
  return balance >= BEACOIN_PRICES.BEACON_PLUS
}

export function monthsUntilBeaconPlus(balance: number): number {
  const needed = BEACOIN_PRICES.BEACON_PLUS - balance
  if (needed <= 0) return 0
  
  const monthlyEarning = calculateMonthlyEarnings()
  return Math.ceil(needed / monthlyEarning)
}
