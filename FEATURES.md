# Beacon - Complete Setup & Features Guide

## Overview
Beacon is a modern, Discord-like communication platform with support for servers, channels, real-time messaging, voice chat, reactions, GIFs, and more.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- PostgreSQL database (for backend)

### Installation

1. **Clone and Install**
   ```bash
   cd Beacon
   pnpm install
   ```

2. **Environment Setup**

   **Web Frontend** (`apps/web/.env`):
   ```env
   VITE_TENOR_API_KEY=your_tenor_api_key_here
   VITE_API_URL=http://localhost:3001/api
   VITE_WS_URL=ws://localhost:3001
   ```

   Get your Tenor API key at: https://tenor.com/developer/keyregistration

   **Backend** (`apps/server/.env`):
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/beacon
   JWT_SECRET=your-secret-key-here
   PORT=3001
   ```

3. **Run the Application**

   ```bash
   # Backend server
   cd apps/server
   pnpm dev

   # Web frontend (in another terminal)
   cd apps/web
   pnpm dev
   ```

## ✨ Features Implemented

### 1. **Customizable Reactions**
- Users can customize their quick reaction emojis
- Access via User Settings → Reactions tab
- Add/remove emojis from quick picker
- Persistent storage using Zustand with localStorage
- Used in message reactions across the platform

**Files:**
- `apps/web/src/stores/useReactionsStore.ts` - State management
- `apps/web/src/components/ui/EmojiPicker.tsx` - Emoji picker component
- `apps/web/src/pages/UserSettings.tsx` - Settings UI

### 2. **GIF Integration (Tenor API)**
- Search and send GIFs in messages
- Trending GIFs on load
- Category browsing
- Real-time search with debouncing
- GIF preview before sending

**Files:**
- `apps/web/src/services/tenor.ts` - Tenor API client
- `apps/web/src/components/ui/GifPicker.tsx` - GIF picker component
- `apps/web/src/components/features/MessageInput.tsx` - Message input with GIF support
- `apps/web/src/components/chat/ChatArea.tsx` - GIF message rendering

### 3. **Message System**
- Real-time messaging
- Message reactions with customizable emojis
- GIF messages
- Message editing and deletion
- Reply to messages
- Typing indicators
- Message search

**Files:**
- `apps/web/src/stores/useMessageStore.ts`
- `apps/web/src/components/features/MessageItem.tsx`
- `apps/web/src/components/features/MessageInput.tsx`

### 4. **WebSocket Integration**
- Real-time communication
- Auto-reconnection
- Heartbeat mechanism
- Event-based architecture
- Support for multiple event types

**Files:**
- `apps/web/src/services/websocket.ts`

### 5. **API Client**
Comprehensive API client with:
- Authentication (login, register, logout)
- Token refresh mechanism
- User management
- Server (Guild) operations
- Channel management
- Message operations
- Member management
- Friend system

**Files:**
- `packages/api-client/src/index.ts`

### 6. **UI Components**
Complete set of reusable components:
- Button, Input, Modal
- Avatar, Badge, Dropdown
- Tabs, Toast, Tooltip
- Collapsible panels
- EmojiPicker
- GifPicker

**Location:** `apps/web/src/components/ui/`

### 7. **State Management**
Using Zustand for state management:
- `useAuthStore` - Authentication & user state
- `useServerStore` - Server/guild management
- `useMessageStore` - Messages by channel
- `useUserListStore` - Online users tracking
- `useVoiceStore` - Voice chat state
- `useUIStore` - UI preferences
- `useReactionsStore` - Custom reactions

**Location:** `apps/web/src/stores/`

### 8. **Pages**
- Login/Register
- Home with server list
- Server view with channels
- User Settings (Profile, Security, Notifications, Reactions)
- Server Settings
- User Profile
- Voice Channel
- Admin Panel

**Location:** `apps/web/src/pages/`

## 🎨 Styling
- CSS Modules for component styling
- CSS Variables for theming
- Responsive design
- Dark mode support

## 📦 Project Structure

```
Beacon/
├── apps/
│   ├── desktop/          # Tauri desktop app
│   ├── mobile/           # Capacitor mobile app
│   ├── server/           # Backend API & WebSocket server
│   └── web/             # React web frontend
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/           # Reusable UI components
│       │   │   ├── features/     # Feature-specific components
│       │   │   ├── layout/       # Layout components
│       │   │   └── chat/         # Chat-related components
│       │   ├── pages/            # Page components
│       │   ├── stores/           # Zustand stores
│       │   ├── services/         # API & service clients
│       │   └── styles/           # Global styles
│       └── .env.example
└── packages/
    ├── api-client/      # API client library
    ├── beacon-js/       # Shared JavaScript utilities
    └── types/           # Shared TypeScript types
```

## 🔧 Key Technologies

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Zustand** - State management
- **React Router** - Routing
- **Lucide React** - Icons
- **Tenor API** - GIF integration

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **WebSocket** - Real-time communication
- **PostgreSQL** - Database
- **Prisma** - ORM (recommended)

### Cross-Platform
- **Tauri** - Desktop apps
- **Capacitor** - Mobile apps

## 🎯 Usage Guide

### Sending Messages
1. Type your message in the input box
2. Click the emoji icon to add emojis
3. Click the GIF icon to search and add GIFs
4. Press Enter or click Send

### Customizing Reactions
1. Go to User Settings (gear icon)
2. Navigate to "Reactions" tab
3. Add new emojis or remove existing ones
4. Click "Reset to Defaults" to restore default reactions

### Using GIFs
1. Click the GIF button in message input
2. Browse trending GIFs or search for specific GIFs
3. Click on a GIF to send it immediately
4. GIFs appear inline in the chat

### Reacting to Messages
1. Hover over any message
2. Click the reaction button
3. Choose from your custom emoji reactions
4. Click an emoji to add it as a reaction

## 🔐 Security Features
- JWT-based authentication
- Token refresh mechanism
- Secure password hashing (backend)
- Protected routes
- CORS configuration

## 🚧 Future Enhancements

- [ ] File upload system
- [ ] Voice & video calls (WebRTC)
- [ ] End-to-end encryption
- [ ] Mobile push notifications
- [ ] Rich text editor
- [ ] Code syntax highlighting
- [ ] Stickers and custom emojis
- [ ] Thread support
- [ ] Screen sharing
- [ ] Integration bots
- [ ] Webhook support

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update current user
- `GET /api/users/:id` - Get user by ID

### Guilds (Servers)
- `GET /api/guilds` - List user's guilds
- `POST /api/guilds` - Create guild
- `GET /api/guilds/:id` - Get guild
- `PUT /api/guilds/:id` - Update guild
- `DELETE /api/guilds/:id` - Delete guild

### Channels
- `GET /api/guilds/:guildId/channels` - List channels
- `POST /api/guilds/:guildId/channels` - Create channel
- `GET /api/channels/:id` - Get channel
- `PUT /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Delete channel

### Messages
- `GET /api/channels/:channelId/messages` - List messages
- `POST /api/channels/:channelId/messages` - Send message
- `GET /api/channels/:channelId/messages/:id` - Get message
- `PUT /api/channels/:channelId/messages/:id` - Edit message
- `DELETE /api/channels/:channelId/messages/:id` - Delete message

## 🐛 Troubleshooting

### GIF Picker Not Working
- Verify `VITE_TENOR_API_KEY` is set in `.env`
- Check browser console for API errors
- Ensure internet connection is active

### WebSocket Connection Failed
- Verify backend is running
- Check `VITE_WS_URL` in `.env`
- Ensure firewall allows WebSocket connections

### Styles Not Loading
- Clear browser cache
- Restart Vite dev server
- Check CSS module imports

## 📄 License
MIT License - See LICENSE file for details

## 🤝 Contributing
Contributions are welcome! Please follow the existing code style and add tests for new features.

## 📧 Support
For issues and questions, please open a GitHub issue.

---

Built with ❤️ using React, TypeScript, and modern web technologies.
