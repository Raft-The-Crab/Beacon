import { create } from 'zustand'
import { api } from '../lib/api'
import type { MessageWithExtras as Message } from '@beacon/types'

interface MessageState {
  messages: Map<string, Message[]> // channelId -> messages
  isLoading: Map<string, boolean> // channelId -> loading state

  // Actions
  fetchMessages: (channelId: string) => Promise<void>
  sendMessage: (channelId: string, content: string, attachments?: any[]) => Promise<void>
  getMessages: (channelId: string) => Message[] // Add this selector

  // Socket handlers
  handleMessageCreate: (message: Message & { channelId: string }) => void
  handleMessageUpdate: (channelId: string, messageId: string, updates: Partial<Message>) => void
  handleMessageDelete: (channelId: string, messageId: string) => void
}

export const useMessageStore = create<MessageState>((set, get) => ({ // Add 'get' here
  messages: new Map(),
  isLoading: new Map(),

  // Selector to get messages for a specific channel
  getMessages: (channelId: string) => {
    return get().messages.get(channelId) || [];
  },

  fetchMessages: async (channelId) => {
    // Set loading
    set(state => {
      const newLoading = new Map(state.isLoading);
      newLoading.set(channelId, true);
      return { isLoading: newLoading }
    });

    try {
      const { data } = await api.get(`/channels/${channelId}/messages`);
      set(state => {
        const newMessages = new Map(state.messages);
        newMessages.set(channelId, data);

        const newLoading = new Map(state.isLoading);
        newLoading.set(channelId, false);
        return { messages: newMessages, isLoading: newLoading };
      });
    } catch (error) {
      console.error(error);
      set(state => {
        const newLoading = new Map(state.isLoading);
        newLoading.set(channelId, false);
        return { isLoading: newLoading }
      });
    }
  },

  sendMessage: async (channelId, content, attachments) => {
    // We don't optimistically update here because we expect a fast socket event back
    // Or we could. For now, let's rely on the API response or Socket.
    try {
      await api.post(`/channels/${channelId}/messages`, { content, attachments });
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  handleMessageCreate: (message) => {
    const { channelId } = message;
    set(state => {
      const current = state.messages.get(channelId) || [];
      // Dedupe - if message already exists, do NOT create a new Map,
      // which would trigger an unnecessary state update.
      if (current.find(m => m.id === message.id)) {
        return state; // Return current state to prevent update
      }

      const newMessages = new Map(state.messages);
      newMessages.set(channelId, [...current, message]);
      return { messages: newMessages };
    });
  },

  handleMessageUpdate: (channelId, messageId, updates) => {
    set(state => {
      const newMessages = new Map(state.messages);
      const current = newMessages.get(channelId) || [];
      const updated = current.map(m => m.id === messageId ? { ...m, ...updates } : m);
      newMessages.set(channelId, updated);
      return { messages: newMessages };
    });
  },

  handleMessageDelete: (channelId, messageId) => {
    set(state => {
      const newMessages = new Map(state.messages);
      const current = newMessages.get(channelId) || [];
      const filtered = current.filter(m => m.id !== messageId);
      newMessages.set(channelId, filtered);
      return { messages: newMessages };
    });
  }
}))