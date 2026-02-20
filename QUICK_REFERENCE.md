# 🚀 BEACON - QUICK REFERENCE GUIDE

## 📝 **NOTES FEATURE**

### Create Note
```typescript
POST /api/notes/:guildId
{
  "title": "Meeting Notes",
  "content": "Discussion points..."
}
```

### Add Music
```typescript
POST /api/notes/:guildId/:noteId/music
{
  "title": "Background Music",
  "artist": "Artist Name",
  "url": "https://youtube.com/watch?v=..."
}
```

### Supported Music Sources
- YouTube: `https://youtube.com/watch?v=...`
- Spotify: `https://open.spotify.com/track/...`
- SoundCloud: `https://soundcloud.com/...`
- Direct MP3: `https://example.com/song.mp3`

---

## 🤖 **AI MODERATION**

### Check Status
```bash
# View moderation logs
tail -f logs/moderation.log

# Get reports
GET /api/moderation/reports
```

### What It Blocks
- Toxicity
- Spam
- NSFW content
- Phishing links
- Hate speech

---

## ⚡ **PERFORMANCE OPTIMIZER**

### Check Device Status
```typescript
import { performanceOptimizer } from './utils/performanceOptimizer'

// Check if low-spec mode is active
if (performanceOptimizer.isLowSpecDevice()) {
  console.log('Running in low-spec mode')
}

// Get settings
const settings = performanceOptimizer.getSettings()
console.log(settings.maxMessages) // 50 or 100
```

### Manual Override
```typescript
// Force low-spec mode
document.documentElement.classList.add('low-spec-mode')

// Disable animations
localStorage.setItem('disableAnimations', 'true')
```

---

## 🎨 **UI SYSTEM**

### Buttons
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-sm">Small</button>
<button class="btn btn-lg">Large</button>
```

### Inputs
```html
<input class="input" placeholder="Type here..." />
<textarea class="input" rows="4"></textarea>
```

### Cards
```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

### Badges
```html
<span class="badge">New</span>
<span class="badge" style="background: #ef4444">Hot</span>
```

### Utility Classes
```html
<div class="flex items-center gap-md">
  <img class="avatar" src="..." />
  <span class="text-lg font-bold">Username</span>
</div>
```

---

## 🎨 **THEMES**

### Available Themes
```typescript
import { useThemeStore } from './stores/useThemeStore'

const { theme, setTheme } = useThemeStore()

// Switch theme
setTheme('midnight') // Default dark
setTheme('aurora')   // Light
setTheme('neon')     // Cyberpunk
setTheme('sakura')   // Pastel
setTheme('ocean')    // Blue
```

### Theme Colors
```css
/* Access theme colors */
background: var(--bg-primary);
color: var(--text-primary);
border: 1px solid var(--glass-border);
box-shadow: var(--shadow);
```

---

## 📱 **ANDROID BUILD**

### Build APK
```bash
cd apps/mobile
npm run build
npx cap sync
cd android
./gradlew assembleRelease
```

### Output
```
android/app/build/outputs/apk/release/app-release.apk
```

### Supported Architectures
- ARM (armeabi-v7a)
- ARM64 (arm64-v8a)
- x86
- x86_64

---

## 🖥️ **WINDOWS BUILD**

### Build Desktop App
```bash
cd apps/desktop
npm run build
cargo build --release --manifest-path src-tauri/Cargo.toml
```

### Output
```
src-tauri/target/release/beacon.exe
```

---

## 📦 **SDK USAGE**

### Install
```bash
npm install beacon.js
```

### Basic Bot
```typescript
import { Client } from 'beacon.js'

const client = new Client({ token: process.env.TOKEN })

client.on('ready', () => {
  console.log('Bot ready!')
})

client.on('messageCreate', async (msg) => {
  if (msg.content === '!ping') {
    await msg.reply('Pong!')
  }
})

client.login()
```

### With Storage
```typescript
// Save data
await client.storage.set('points', userId, 100)

// Get data
const points = await client.storage.get('points', userId)
```

### With Scheduling
```typescript
// Run daily at midnight
client.scheduler.schedule('0 0 * * *', async () => {
  console.log('Daily task!')
})
```

---

## 🚀 **DEPLOYMENT**

### Railway
```bash
railway login
railway init
railway up
```

### Environment Variables
```env
DATABASE_URL=postgresql://...
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
CLOUDINARY_URL=cloudinary://...
JWT_SECRET=your-secret
NODE_ENV=production
```

---

## 📊 **MONITORING**

### Health Check
```bash
curl https://your-domain.com/health
```

### Logs
```bash
# Server logs
railway logs

# Or local
tail -f logs/app.log
```

### Metrics
```bash
# Memory usage
free -m

# CPU usage
htop

# Database connections
psql -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 🐛 **TROUBLESHOOTING**

### High Memory
```bash
# Restart with lower limit
NODE_OPTIONS="--max-old-space-size=384" npm start
```

### Build Errors
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules
npm install
```

### Android Issues
```bash
# Clean build
cd android
./gradlew clean
./gradlew assembleRelease
```

---

## 📚 **DOCUMENTATION**

- **Main Docs**: https://docs.beacon.chat
- **API Reference**: https://docs.beacon.chat/api
- **SDK Docs**: https://docs.beacon.chat/sdk
- **GitHub**: https://github.com/Raft-The-Crab/Beacon

---

## 🆘 **SUPPORT**

- **Discord**: https://beacon.chat/discord
- **Email**: support@beacon.chat
- **Issues**: https://github.com/Raft-The-Crab/Beacon/issues

---

**Quick Links:**
- [Production Plan](./PRODUCTION_PLAN.md)
- [Launch Checklist](./LAUNCH_CHECKLIST.md)
- [Biggest Update](./BIGGEST_UPDATE.md)
- [Quick Start](./QUICK_START.md)
