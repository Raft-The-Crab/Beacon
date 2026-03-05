class ApiClient {
    private token: string | null = null;
    private baseUrl = '/api'; // Assuming proxy handles this
    private csrfToken: string | null = null;

    constructor() {
        this.token = localStorage.getItem('beacon_token');
        this.initCsrf();
    }

    private async initCsrf() {
        try {
            const res = await fetch(`${this.baseUrl}/csrf-token`, { credentials: 'include' });
            const data = await res.json();
            if (data.token) {
                this.csrfToken = data.token;
            }
        } catch (e) {
            console.error('Failed to fetch CSRF token', e);
        }
    }

    getAccessToken() {
        return this.token;
    }

    private setToken(token: string) {
        this.token = token;
        localStorage.setItem('beacon_token', token);
    }

    public async request(method: string, endpoint: string, data?: any) {
        if (!this.csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            await this.initCsrf();
        }

        const headers: Record<string, string> = {};
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
        if (this.csrfToken) headers['x-csrf-token'] = this.csrfToken;
        if (data) headers['Content-Type'] = 'application/json';

        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers,
            credentials: 'include',
            body: data ? JSON.stringify(data) : undefined,
        });

        // Beacon API standard wrapper
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            return { success: false, error: json.error || res.statusText };
        }
        return { success: true, data: json.data || json };
    }

    async login(email: string, password: string) {
        const res = await this.request('POST', '/auth/login', { email, password });
        if (res.success && res.data?.accessToken) {
            this.setToken(res.data.accessToken);
        }
        return res;
    }

    async register(email: string, username: string, password: string) {
        const res = await this.request('POST', '/auth/register', { email, username, password });
        if (res.success && res.data?.accessToken) {
            this.setToken(res.data.accessToken);
        }
        return res;
    }

    async logout() {
        this.token = null;
        localStorage.removeItem('beacon_token');
    }

    async getCurrentUser() {
        return this.request('GET', '/users/me');
    }

    async updateUser(updates: any) {
        return this.request('PATCH', '/users/me', updates);
    }

    async sendMessage(channelId: string, data: { content: string }) {
        return this.request('POST', `/channels/${channelId}/messages`, data);
    }

    async updateMessage(channelId: string, messageId: string, content: string) {
        return this.request('PATCH', `/channels/${channelId}/messages/${messageId}`, { content });
    }

    async deleteMessage(channelId: string, messageId: string) {
        return this.request('DELETE', `/channels/${channelId}/messages/${messageId}`);
    }

    async addReaction(channelId: string, messageId: string, emoji: string) {
        return this.request('PUT', `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`);
    }

    async removeReaction(channelId: string, messageId: string, emoji: string) {
        return this.request('DELETE', `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`);
    }

    // -- GUILD MANAGEMENT --
    async getGuildMembers(guildId: string) {
        return this.request('GET', `/guilds/${guildId}/members`);
    }

    async updateGuildMember(guildId: string, userId: string, data: { nickname?: string, roles?: string[] }) {
        return this.request('PATCH', `/guilds/${guildId}/members/${userId}`, data);
    }

    async kickMember(guildId: string, userId: string) {
        return this.request('DELETE', `/guilds/${guildId}/members/${userId}/kick`);
    }

    async banMember(guildId: string, userId: string, reason?: string) {
        return this.request('POST', `/guilds/${guildId}/members/${userId}/ban`, { reason });
    }

    async getBans(guildId: string) {
        return this.request('GET', `/guilds/${guildId}/bans`);
    }

    async unbanMember(guildId: string, userId: string) {
        return this.request('DELETE', `/guilds/${guildId}/bans/${userId}`);
    }

    async getInvites(guildId: string) {
        return this.request('GET', `/guilds/${guildId}/invites`);
    }

    async deleteInvite(guildId: string, inviteCode: string) {
        return this.request('DELETE', `/guilds/${guildId}/invites/${inviteCode}`);
    }

    async getAuditLogs(guildId: string) {
        return this.request('GET', `/guilds/${guildId}/audit-logs`);
    }

    async getWebhooks(guildId: string) {
        return this.request('GET', `/guilds/${guildId}/webhooks`);
    }

    async createWebhook(guildId: string, data: { name: string, channelId: string, avatar?: string }) {
        return this.request('POST', `/guilds/${guildId}/webhooks`, data);
    }

    async updateWebhook(guildId: string, webhookId: string, data: { name?: string, channelId?: string, avatar?: string }) {
        return this.request('PATCH', `/guilds/${guildId}/webhooks/${webhookId}`, data);
    }

    async deleteWebhook(guildId: string, webhookId: string) {
        return this.request('DELETE', `/guilds/${guildId}/webhooks/${webhookId}`);
    }

    async getEmojis(guildId: string) {
        return this.request('GET', `/guilds/${guildId}/emojis`);
    }

    async createEmoji(guildId: string, data: { name: string, imageUrl: string, animated?: boolean }) {
        return this.request('POST', `/guilds/${guildId}/emojis`, data);
    }

    async deleteEmoji(guildId: string, emojiId: string) {
        return this.request('DELETE', `/guilds/${guildId}/emojis/${emojiId}`);
    }

    // -- USER SECURITY --
    async updateEmail(data: { email: string, password?: string }) {
        return this.request('POST', '/users/me/email', data);
    }

    async updatePassword(data: { oldPassword?: string, newPassword?: string }) {
        return this.request('POST', '/users/me/password', data);
    }

    async enable2FA() {
        return this.request('POST', '/users/me/2fa/enable');
    }

    async verify2FA(code: string) {
        return this.request('POST', '/users/me/2fa/verify', { code });
    }

    // -- SLASH COMMANDS --
    async getSlashCommands(guildId?: string) {
        const url = guildId ? `/guilds/${guildId}/commands` : '/applications/global/commands';
        return this.request('GET', url);
    }

    async getGuildRoles(guildId: string) {
        return this.request('GET', `/guilds/${guildId}/roles`);
    }

    async executeInteraction(data: any) {
        return this.request('POST', '/interactions', data);
    }
}

export const apiClient = new ApiClient();
