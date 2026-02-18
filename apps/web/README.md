# Beacon Web Frontend Development

This is the React-based web frontend for Beacon, built with Vite.

## Features

✅ Real-time messaging with WebSocket
✅ Customizable emoji reactions
✅ GIF integration (Tenor API)
✅ Server and channel management
✅ User profiles and settings
✅ Voice channel UI
✅ Admin panel
✅ Responsive design
✅ Dark mode

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Create `.env` file:**
   ```env
   VITE_TENOR_API_KEY=your_tenor_api_key_here
   VITE_API_URL=http://localhost:3001/api
   VITE_WS_URL=ws://localhost:3001
   ```

   Get your free Tenor API key at: https://tenor.com/developer/keyregistration

3. **Run development server:**
   ```bash
   pnpm dev
   ```

4. **Build for production:**
   ```bash
   pnpm build
   ```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── features/        # Feature components (messages, etc)
│   ├── layout/          # Layout components
│   └── chat/            # Chat-specific components
├── pages/               # Page components
├── stores/              # Zustand state stores
├── services/            # API clients and services
└── styles/              # Global styles
```

## Key Components

### UI Components
- `Button`, `Input`, `Modal`, `Avatar`, `Badge`
- `Dropdown`, `Tabs`, `Toast`, `Tooltip`
- `EmojiPicker`, `GifPicker`, `Collapsible`

### Feature Components
- `MessageInput` - Send messages, GIFs, and emojis
- `MessageItem` - Display messages with reactions
- `DMList` - Direct messages list

### Layout Components
- `MainLayout` - App layout wrapper
- `ServerList` - Server sidebar
- `Sidebar` - Channel sidebar

## State Management

Using Zustand for state:
- `useAuthStore` - Authentication
- `useServerStore` - Servers/guilds
- `useMessageStore` - Messages
- `useReactionsStore` - Custom reactions
- `useUIStore` - UI preferences
- `useVoiceStore` - Voice state

## Services

- `websocket.ts` - WebSocket client
- `tenor.ts` - Tenor GIF API client
- API client from `@beacon/api-client` package

## Styling

- CSS Modules for component styles
- CSS Variables for theming
- Global styles in `styles/`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_TENOR_API_KEY` | Tenor GIF API key | Yes |
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_WS_URL` | WebSocket server URL | Yes |

## Scripts

- `pnpm dev` - Start dev server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Lint code

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Notes

- TypeScript strict mode enabled
- CSS Modules for scoped styling
- Vite for fast development and builds
