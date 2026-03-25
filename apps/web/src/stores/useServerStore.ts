import { create } from 'zustand'
import type { Guild as Server, Channel } from 'beacon-sdk'
import { api } from '../lib/api'

interface ServerFolder {
  id: string;
  name: string;
  color: string;
  serverIds: string[];
  isCollapsed: boolean;
}

function normalizeFolder(folder: any): ServerFolder {
  const serverIds = Array.isArray(folder?.serverIds)
    ? folder.serverIds
    : (Array.isArray(folder?.guildIds) ? folder.guildIds : [])

  return {
    ...folder,
    serverIds,
    isCollapsed: false,
  }
}

interface ServerState {
  servers: Server[];
  folders: ServerFolder[];
  currentServerId: string | null;
  currentServer: Server | null;
  isLoading: boolean;

  fetchGuilds: () => Promise<void>;
  eagerLoad: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  fetchGuild: (id: string) => Promise<void>;
  createGuild: (name: string, icon?: string) => Promise<void>;
  createChannel: (guildId: string, name: string, type: string, parentId?: string) => Promise<void>;
  updateChannel: (guildId: string, channelId: string, updates: Partial<Channel>) => Promise<void>;
  deleteChannel: (guildId: string, channelId: string) => Promise<void>;
  updateGuild: (guildId: string, updates: Partial<Server>) => Promise<void>;
  deleteGuild: (guildId: string) => Promise<void>;
  setCurrentServer: (serverId: string | null) => void;
  boostGuild: (guildId: string) => Promise<void>;
  updateVanityUrl: (guildId: string, vanityUrl: string) => Promise<void>;
  joinGuild: (guildId: string) => Promise<void>;
  leaveGuild: (guildId: string) => Promise<void>;

  createFolder: (name: string, serverIds: string[], color?: string) => Promise<void>;
  toggleFolder: (folderId: string) => void;
  addToFolder: (folderId: string, serverId: string) => Promise<void>;
  removeFromFolder: (folderId: string, serverId: string) => Promise<void>;

  handleGuildCreate: (guild: Server) => void;
  handleChannelCreate: (channel: Channel) => void;
    handleGuildUpdate: (guildId: string, updates: Partial<Server>) => void;
    handleChannelUpdate: (guildId: string, channelId: string, updates: Partial<Channel>) => void;
    handleChannelDelete: (guildId: string, channelId: string) => void;
    handleMemberRemove: (guildId: string, userId: string) => void;
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

  eagerLoad: async () => {
    try {
      const [{ data: guilds }, { data: folders }] = await Promise.all([
        api.get<Server[]>('/guilds/me').catch(() => ({ data: [] })),
        api.get<ServerFolder[]>('/folders').catch(() => ({ data: [] }))
      ]);

      const safeGuilds = Array.isArray(guilds) ? guilds : [];
      const safeFoldersRaw = Array.isArray(folders) ? folders : [];

      set({
        servers: safeGuilds,
        folders: safeFoldersRaw.map(normalizeFolder)
      });

      if (safeGuilds.length > 0 && !get().currentServerId) {
        get().setCurrentServer(safeGuilds[0].id);
      }
    } catch (error) {
      console.error('Store eager load critical failure', error);
      // Ensure state is at least normalized even on failure
      set({ servers: [], folders: [] });
    }
  },

  fetchFolders: async () => {
    try {
      const { data } = await api.get<ServerFolder[]>('/folders');
      set({ folders: (data as any[]).map(normalizeFolder) });
    } catch (error) {
      console.error('Failed to fetch folders', error);
    }
  },

  fetchGuild: async (id) => {
    try {
      const { data } = await api.get(`/guilds/${id}`);
      set(state => ({
        servers: state.servers.map(s => s.id === id ? { ...s, ...data } : s) as any,
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
        servers: [...state.servers, data] as any,
        currentServerId: data.id,
        currentServer: data as any
      }))
    } catch (error) {
      throw error;
    }
  },

  createChannel: async (guildId, name, type, parentId) => {
    try {
      const { data } = await api.post('/channels', { guildId, name, type, parentId });
      set(state => ({
        servers: state.servers.map(s => {
          if (s.id === guildId) {
            return { ...s, channels: [...(s.channels || []), data] } as any
          }
          return s
        }),
        currentServer: state.currentServerId === guildId
          ? { ...state.currentServer, channels: [...(state.currentServer?.channels || []), data] } as any
          : state.currentServer
      }))
    } catch (error) {
      console.error('Create Channel Error:', error);
      throw error;
    }
  },

  updateChannel: async (guildId, channelId, updates) => {
    try {
      const { data } = await api.patch(`/channels/${channelId}`, updates);
      set(state => ({
        servers: state.servers.map(s => {
          if (s.id === guildId) {
            return {
              ...s,
              channels: s.channels?.map((c: any) => c.id === channelId ? { ...c, ...data } : c) || []
            } as any
          }
          return s
        }),
        currentServer: state.currentServerId === guildId
          ? {
            ...state.currentServer!,
            channels: state.currentServer?.channels?.map((c: any) => c.id === channelId ? { ...c, ...data } : c) || []
          } as any
          : state.currentServer
      }))
    } catch (error) {
      console.error('Update Channel Error:', error);
      throw error;
    }
  },

  deleteChannel: async (guildId, channelId) => {
    try {
      await api.delete(`/channels/${channelId}`);
      set(state => ({
        servers: state.servers.map(s => {
          if (s.id === guildId) {
            return {
              ...s,
              channels: s.channels?.filter((c: any) => c.id !== channelId) || []
            } as any
          }
          return s
        }),
        currentServer: state.currentServerId === guildId
          ? {
            ...state.currentServer!,
            channels: state.currentServer?.channels?.filter((c: any) => c.id !== channelId) || []
          } as any
          : state.currentServer
      }))
    } catch (error) {
      console.error('Delete Channel Error:', error);
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

    // Guild list payloads can be lightweight; hydrate full guild details on selection.
    const hasChannels = Array.isArray((server as any)?.channels) && (server as any).channels.length > 0
    const hasMembers = Array.isArray((server as any)?.members) && (server as any).members.length > 0
    if (!hasChannels || !hasMembers) {
      void get().fetchGuild(serverId)
    }
  },

  boostGuild: async (guildId) => {
    try {
      const { data } = await api.post(`/guilds/${guildId}/boost`);
      set(state => ({
        servers: state.servers.map(s => s.id === guildId ? { ...s, ...data.guild } : s),
        currentServer: state.currentServerId === guildId ? ({ ...state.currentServer, ...data.guild } as any) : state.currentServer
      }));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  updateVanityUrl: async (guildId, vanityUrl) => {
    try {
      const { data } = await api.post(`/guilds/${guildId}/vanity`, { vanityUrl });
      set(state => ({
        servers: state.servers.map(s => s.id === guildId ? { ...s, ...data } : s),
        currentServer: state.currentServerId === guildId ? ({ ...state.currentServer, ...data } as any) : state.currentServer
      }));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  joinGuild: async (guildId) => {
    try {
      const { data } = await api.post(`/guilds/${guildId}/join`);
      set(state => ({
        servers: [...state.servers.filter(s => s.id !== data.id), data] as any
      }));
      get().setCurrentServer(data.id);
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  leaveGuild: async (guildId) => {
    try {
      await api.delete(`/guilds/${guildId}/leave`);
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

  createFolder: async (name, serverIds, color = '#5865f2') => {
    try {
      const { data } = await api.post('/folders', { name, guildIds: serverIds, color });
      set(state => ({ folders: [...state.folders, normalizeFolder(data)] }));
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
      const { data } = await api.post('/folders', { id: folderId, name: folder.name, guildIds: newServerIds, color: folder.color });
      set(state => ({ folders: state.folders.map(f => f.id === folderId ? normalizeFolder(data) : f) }));
    } catch (error) {
      console.error(error);
    }
  },

  removeFromFolder: async (folderId, serverId) => {
    try {
      const folder = get().folders.find(f => f.id === folderId);
      if (!folder) return;
      const newServerIds = folder.serverIds.filter(id => id !== serverId);
      const { data } = await api.post('/folders', { id: folderId, name: folder.name, guildIds: newServerIds, color: folder.color });
      set(state => ({ folders: state.folders.map(f => f.id === folderId ? normalizeFolder(data) : f) }));
    } catch (error) {
      console.error(error);
    }
  },

  handleGuildCreate: (guild) => set(state => ({
    servers: [...state.servers.filter(s => s.id !== guild.id), guild] as any
  })),
  handleChannelCreate: (channel) => {
    set(state => ({
      servers: state.servers.map(s => {
        if (s.id === channel.guildId) {
          const channels = s.channels || []
          if (channels.some((c: any) => c.id === channel.id)) return s
          return { ...s, channels: [...channels, channel] } as any
        }
        return s
      }),
      currentServer: state.currentServerId === channel.guildId
        ? { ...state.currentServer, channels: [...(state.currentServer?.channels || []).filter((c: any) => c.id !== channel.id), channel] } as Server
        : state.currentServer
    }))
  },

    handleGuildUpdate: (guildId, updates) =>
      set(state => ({
        servers: state.servers.map(s => s.id === guildId ? { ...s, ...updates } : s) as any,
        currentServer: state.currentServerId === guildId ? ({ ...state.currentServer, ...updates } as any) : state.currentServer
      })),

    handleChannelUpdate: (guildId, channelId, updates) =>
      set(state => ({
        servers: state.servers.map(s => s.id === guildId
          ? { ...s, channels: s.channels?.map((c: any) => c.id === channelId ? { ...c, ...updates } : c) || [] } as any
          : s),
        currentServer: state.currentServerId === guildId
          ? { ...state.currentServer!, channels: state.currentServer?.channels?.map((c: any) => c.id === channelId ? { ...c, ...updates } : c) || [] } as any
          : state.currentServer
      })),

    handleChannelDelete: (guildId, channelId) =>
      set(state => ({
        servers: state.servers.map(s => s.id === guildId
          ? { ...s, channels: s.channels?.filter((c: any) => c.id !== channelId) || [] } as any
          : s),
        currentServer: state.currentServerId === guildId
          ? { ...state.currentServer!, channels: state.currentServer?.channels?.filter((c: any) => c.id !== channelId) || [] } as Server
          : state.currentServer
      })),

    handleMemberRemove: (guildId, userId) =>
      set(state => ({
        servers: state.servers.map(s => s.id === guildId
          ? { ...s, members: (s as any).members?.filter((m: any) => m.userId !== userId) || [] } as any
          : s),
        currentServer: state.currentServerId === guildId
          ? { ...state.currentServer!, members: (state.currentServer as any)?.members?.filter((m: any) => m.userId !== userId) || [] } as any
          : state.currentServer
      })),
}))
