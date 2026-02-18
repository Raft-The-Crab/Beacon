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

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  folders: [],
  currentServerId: null,
  currentServer: null,
  isLoading: false,

  fetchGuilds: async () => {
    set({ isLoading: true })
    try {
      const { data } = await api.get('/guilds/me')
      set({ servers: data, isLoading: false })
      if (data.length > 0 && !get().currentServerId) {
        get().setCurrentServer(data[0].id)
      }
      await get().fetchFolders()
    } catch (error) {
      console.error('Failed to fetch guilds', error)
      set({ isLoading: false })
    }
  },

  fetchFolders: async () => {
    try {
      const { data } = await api.get('/folders');
      set({ folders: data.map((f: any) => ({ ...f, isCollapsed: false })) });
    } catch (error) {
      console.error('Failed to fetch folders', error);
    }
  },

  fetchGuild: async (id) => {
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
