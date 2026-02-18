import { create } from 'zustand'
import { Server, Channel } from '@beacon/types'
import { api } from '../lib/api'

interface ServerFolder {
  id: string;
  name: string;
  color: string;
  serverIds: string[];
  isCollapsed: boolean;
}

interface ServerState {
  servers: Server[];
  folders: ServerFolder[];
  currentServerId: string | null;
  currentServer: Server | null;
  isLoading: boolean;
  
  fetchGuilds: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  fetchGuild: (id: string) => Promise<void>;
  createGuild: (name: string, icon?: string) => Promise<void>;
  createChannel: (guildId: string, name: string, type: string, parentId?: string) => Promise<void>;
  updateGuild: (guildId: string, updates: Partial<Server>) => Promise<void>;
  deleteGuild: (guildId: string) => Promise<void>;
  setCurrentServer: (serverId: string | null) => void;
  
  createFolder: (name: string, serverIds: string[], color?: string) => Promise<void>;
  toggleFolder: (folderId: string) => void;
  addToFolder: (folderId: string, serverId: string) => Promise<void>;
  removeFromFolder: (folderId: string, serverId: string) => Promise<void>;

  handleGuildCreate: (guild: Server) => void;
  handleChannelCreate: (channel: Channel) => void;
}

const MOCK_SERVERS: Server[] = [
  {
    id: 'server-1',
    name: 'Beacon Official',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=beacon',
    banner: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=1000',
    ownerId: 'u1',
    memberCount: 15420,
    members: [],
    channels: [
      { id: 'ch-1-general', name: 'general', type: 'text', guildId: 'server-1', createdAt: new Date().toISOString() } as any,
      { id: 'ch-1-announcements', name: 'announcements', type: 'text', guildId: 'server-1', createdAt: new Date().toISOString() } as any,
      { id: 'ch-1-showcase', name: 'showcase', type: 'text', guildId: 'server-1', createdAt: new Date().toISOString() } as any,
      { id: 'ch-1-voice', name: 'General Voice', type: 'voice', guildId: 'server-1', createdAt: new Date().toISOString() } as any,
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'server-2',
    name: 'TypeScript Wizards',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=ts',
    banner: null,
    ownerId: 'u2',
    memberCount: 850,
    members: [],
    channels: [
      { id: 'ch-2-general', name: 'general', type: 'text', guildId: 'server-2', createdAt: new Date().toISOString() } as any,
      { id: 'ch-2-help', name: 'help', type: 'text', guildId: 'server-2', createdAt: new Date().toISOString() } as any,
      { id: 'ch-2-voice', name: 'Pair Programming', type: 'voice', guildId: 'server-2', createdAt: new Date().toISOString() } as any,
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'server-3',
    name: 'Glassmorphism Enthusiasts',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=glass',
    banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000',
    ownerId: 'u3',
    memberCount: 120,
    members: [],
    channels: [
      { id: 'ch-3-general', name: 'general', type: 'text', guildId: 'server-3', createdAt: new Date().toISOString() } as any,
      { id: 'ch-3-designs', name: 'designs', type: 'text', guildId: 'server-3', createdAt: new Date().toISOString() } as any,
      { id: 'ch-3-voice', name: 'Chill Zone', type: 'voice', guildId: 'server-3', createdAt: new Date().toISOString() } as any,
    ],
    createdAt: new Date().toISOString(),
  }
];

export const useServerStore = create<ServerState>((set, get) => ({
  servers: import.meta.env.DEV ? MOCK_SERVERS : [],
  folders: [
    { id: 'folder-1', name: 'Gaming', color: '#5865f2', serverIds: ['server-1', 'server-2'], isCollapsed: false },
    { id: 'folder-2', name: 'Work', color: '#3ba55c', serverIds: ['server-3'], isCollapsed: false },
  ],
  currentServerId: import.meta.env.DEV ? MOCK_SERVERS[0].id : null, 
  currentServer: import.meta.env.DEV ? MOCK_SERVERS[0] : null,
  isLoading: false,

  fetchGuilds: async () => {
    if (import.meta.env.DEV) {
      set({ servers: MOCK_SERVERS, isLoading: false })
      if (MOCK_SERVERS.length > 0 && !get().currentServerId) {
        get().setCurrentServer(MOCK_SERVERS[0].id)
      }
      return;
    }

    set({ isLoading: true })
    try {
      const { data } = await api.get('/guilds/me') 
      set({ servers: data, isLoading: false })
      if (data.length > 0 && !get().currentServerId) {
        get().setCurrentServer(data[0].id)
      }
      // Also fetch folders
      await get().fetchFolders();
    } catch (error) {
      console.error('Failed to fetch guilds', error)
      set({ isLoading: false })
    }
  },

  fetchFolders: async () => {
    if (import.meta.env.DEV) return;
    try {
      const { data } = await api.get('/folders');
      set({ folders: data.map((f: any) => ({ ...f, isCollapsed: false })) });
    } catch (error) {
      console.error('Failed to fetch folders', error);
    }
  },

  fetchGuild: async (id) => {
    if (import.meta.env.DEV) {
      const server = MOCK_SERVERS.find(s => s.id === id);
      if (server) {
        set(state => ({
          servers: state.servers.map(s => s.id === id ? { ...s, ...server } : s),
          currentServer: state.currentServerId === id ? ({ ...state.currentServer, ...server } as any) : state.currentServer
        }));
      }
      return;
    }
    
    try {
      const { data } = await api.get(`/guilds/${id}`);
      set(state => ({
        servers: state.servers.map(s => s.id === id ? { ...s, ...data } : s),
        currentServer: state.currentServerId === id ? ({ ...state.currentServer, ...data } as any) : state.currentServer
      }));
    } catch (error) {
      console.error(error);
    }
  },

  createGuild: async (name, icon) => {
    if (import.meta.env.DEV) {
      const newServer: Server = {
        id: "mock-server-" + Date.now(),
        name: name,
        icon: icon || null,
        banner: null, 
        ownerId: 'current-user', 
        memberCount: 1,
        members: [],
        channels: [],
        createdAt: new Date().toISOString(),
      };
      set(state => ({
        servers: [...state.servers, newServer],
        currentServerId: newServer.id,
        currentServer: newServer
      }));
      return;
    }

    try {
      const { data } = await api.post('/guilds', { name, icon })
      set(state => ({
        servers: [...state.servers, data],
        currentServerId: data.id,
        currentServer: data
      }))
    } catch (error) {
      throw error;
    }
  },

  createChannel: async (guildId, name, type, parentId) => {
    try {
      await api.post('/channels', { guildId, name, type, parentId });
    } catch (error) {
      throw error;
    }
  },

  updateGuild: async (guildId, updates) => {
    try {
      const { data } = await api.patch("/guilds/" + guildId, updates);
      set(state => ({
        servers: state.servers.map(s => s.id === guildId ? { ...s, ...data } : s),
        currentServer: state.currentServerId === guildId ? ({ ...state.currentServer, ...data } as any) : state.currentServer
      }));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  deleteGuild: async (guildId) => {
    try {
      await api.delete("/guilds/" + guildId);
      set(state => {
        const newServers = state.servers.filter(s => s.id !== guildId);
        return {
          servers: newServers,
          currentServerId: state.currentServerId === guildId ? null : state.currentServerId,
          currentServer: state.currentServerId === guildId ? null : state.currentServer
        };
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  setCurrentServer: (serverId: string | null) => {
    if (serverId === null) {
      set({ currentServerId: null, currentServer: null });
      return;
    }
    const server = get().servers.find(s => s.id === serverId) || null;
    set({ currentServerId: serverId, currentServer: server });
  },

  createFolder: async (name, serverIds, color = '#5865f2') => {
    if (import.meta.env.DEV) {
      const newFolder: ServerFolder = {
        id: 'folder-' + Date.now(),
        name,
        color,
        serverIds,
        isCollapsed: false
      };
      set(state => ({ folders: [...state.folders, newFolder] }));
      return;
    }

    try {
      const { data } = await api.post('/folders', { name, serverIds, color });
      set(state => ({ folders: [...state.folders, { ...data, isCollapsed: false }] }));
    } catch (error) {
      console.error(error);
    }
  },

  toggleFolder: (folderId) => {
    set(state => ({
      folders: state.folders.map(f => f.id === folderId ? { ...f, isCollapsed: !f.isCollapsed } : f)
    }));
  },

  addToFolder: async (folderId, serverId) => {
    if (import.meta.env.DEV) {
      set(state => ({
        folders: state.folders.map(f => 
          f.id === folderId ? { ...f, serverIds: [...f.serverIds, serverId] } : f
        )
      }));
      return;
    }

    try {
      const folder = get().folders.find(f => f.id === folderId);
      if (!folder) return;
      
      const newServerIds = [...folder.serverIds, serverId];
      const { data } = await api.post('/folders', { 
        id: folderId, 
        name: folder.name, 
        serverIds: newServerIds, 
        color: folder.color 
      });
      
      set(state => ({
        folders: state.folders.map(f => f.id === folderId ? { ...f, serverIds: data.serverIds } : f)
      }));
    } catch (error) {
      console.error(error);
    }
  },

  removeFromFolder: async (folderId, serverId) => {
    if (import.meta.env.DEV) {
      set(state => ({
        folders: state.folders.map(f => 
          f.id === folderId ? { ...f, serverIds: f.serverIds.filter(id => id !== serverId) } : f
        )
      }));
      return;
    }

    try {
      const folder = get().folders.find(f => f.id === folderId);
      if (!folder) return;
      
      const newServerIds = folder.serverIds.filter(id => id !== serverId);
      const { data } = await api.post('/folders', { 
        id: folderId, 
        name: folder.name, 
        serverIds: newServerIds, 
        color: folder.color 
      });
      
      set(state => ({
        folders: state.folders.map(f => f.id === folderId ? { ...f, serverIds: data.serverIds } : f)
      }));
    } catch (error) {
      console.error(error);
    }
  },

  handleGuildCreate: (guild) => set(state => ({ servers: [...state.servers, guild] })),
  handleChannelCreate: (_channel) => {
    // Socket logic
  }
}))
