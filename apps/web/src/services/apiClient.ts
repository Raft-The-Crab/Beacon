import { API_BASE_URL } from '../config/endpoints';
import { WEB_SDK_ENDPOINTS } from '../lib/beaconSdk';

class ApiClient {
    private token: string | null = null;
    private baseUrl: string;
    private csrfToken: string | null = null;
    private csrfInitPromise: Promise<void> | null = null;
    private maxCsrfRetries: number = 3;

    constructor() {
        this.token = localStorage.getItem('token') || localStorage.getItem('beacon_token') || localStorage.getItem('accessToken');
        
        // Use Vite's native environment detection for absolute reliability 
        // fallback to standard localhost check if import.meta is missing
        const isDev = 
            // @ts-ignore
            (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) || 
            (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
        
        this.baseUrl = isDev ? '/api' : (WEB_SDK_ENDPOINTS.apiUrl || API_BASE_URL);
        
        console.log('[API] Using base URL:', this.baseUrl, isDev ? '(via proxy)' : '(direct)');
        
        // Ensure CSRF token is initialized immediately
        this.csrfInitPromise = this.ensureCsrfToken();
    }

    private getCookie(name: string): string | null {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
    }

     private async initCsrf(): Promise<void> {
        try {
            // Check if CSRF token already exists in memory 
            if (this.csrfToken) return;

            // Check cookies as fallback
            const existingToken = this.getCookie('csrf_token');
            if (existingToken) {
                this.csrfToken = existingToken;
                return;
            }

            const csrfUrl = `${this.baseUrl}/csrf-token`;
            const res = await fetch(csrfUrl, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });

            if (!res.ok) {
                throw new Error(`CSRF fetch failed with status ${res.status}`);
            }

            const data = await res.json();
            // Prioritize JSON body for cross-domain support where cookies might be unreadable via JS
            const token = data?.token || data?.data?.token || this.getCookie('csrf_token');
            
            if (token) {
                this.csrfToken = token;
                console.log('[CSRF] Token successfully initialized');
            } else {
                console.warn('[CSRF] No token in response body, local cookie-read might fail');
            }
        } catch (e) {
            console.error('[CSRF] Failed to fetch token:', e);
            // Final fallback to trying to read from cookie
            const cookieToken = this.getCookie('csrf_token');
            if (cookieToken) {
                this.csrfToken = cookieToken;
            }
        }
    }

    private async ensureCsrfToken(): Promise<void> {
        // Only initialize CSRF once, with retry logic
        if (this.csrfToken) return;
        
        let lastError: Error | null = null;
        for (let i = 0; i < this.maxCsrfRetries; i++) {
            try {
                await this.initCsrf();
                if (this.csrfToken) return;
            } catch (e) {
                lastError = e as Error;
                await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
            }
        }
        
        if (!this.csrfToken) {
            console.warn('[CSRF] Could not initialize token after retries', lastError);
        }
    }

    getAccessToken() {
        return this.token;
    }

    private setToken(token: string) {
        this.token = token;
        localStorage.setItem('token', token);
        localStorage.setItem('beacon_token', token);
    }

    public async request(
        method: string,
        endpoint: string,
        data?: any,
        retryOnCsrf: boolean = true
    ): Promise<{ success: boolean; data?: any; error?: string }> {
        // Refresh token from localStorage in case another flow updated it.
        this.token = localStorage.getItem('token') || localStorage.getItem('beacon_token') || localStorage.getItem('accessToken');

        // Ensure CSRF token is initialized before making mutation requests
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            if (this.csrfInitPromise) {
                await this.csrfInitPromise;
            }
            
            // If still no token, try one more time
            if (!this.csrfToken) {
                this.csrfToken = this.getCookie('csrf_token');
            }
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Send the token if we have it in memory
        if (this.csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            headers['x-csrf-token'] = this.csrfToken;
        } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            // If not in memory, try a last second cookie read (mostly for localhost)
            const lastResort = this.getCookie('csrf_token');
            if (lastResort) {
                headers['x-csrf-token'] = lastResort;
            }
        }

        const url = this.baseUrl + endpoint;
        
        try {
            const res = await fetch(url, {
                method,
                headers,
                credentials: 'include',
                body: data ? JSON.stringify(data) : undefined,
            });

            const text = await res.text();
            let json: any = {};
            try {
                json = JSON.parse(text);
            } catch (e) {
                if (text.trim().startsWith('<!DOCTYPE')) {
                    console.error(`[API] Expected JSON but received HTML from ${method} ${endpoint}. This usually means the path is incorrect or hitting a 404 page.`);
                } else {
                    console.error(`[API] Failed to parse JSON response from ${method} ${endpoint}:`, text.slice(0, 100));
                }
            }

            // Handle CSRF failures with recovery
            if (
                retryOnCsrf &&
                res.status === 403 &&
                typeof json?.error === 'string' &&
                json.error.toLowerCase().includes('csrf')
            ) {
                console.warn('[CSRF] Token mismatch detected, refreshing token and retrying');
                this.csrfToken = null;
                this.csrfInitPromise = this.ensureCsrfToken();
                await this.csrfInitPromise;
                return this.request(method, endpoint, data, false);
            }

            if (!res.ok) {
                const error = json.error || json.message || res.statusText;
                console.error(`[API] ${res.status} error on ${method} ${endpoint}:`, error);
                return { success: false, error };
            }

            return { success: true, data: json.data || json };
        } catch (error) {
            console.error(`[API] Network error on ${method} ${endpoint}:`, error);
            return { success: false, error: error instanceof Error ? error.message : 'Network error' };
        }
    }

    async login(identifier: string, password: string) {
        const res = await this.request('POST', '/auth/login', { identifier, password });
        if (res.success && res.data?.accessToken) {
            this.setToken(res.data.accessToken);
        }
        return res;
    }

    async socialLogin(idToken: string) {
        const res = await this.request('POST', '/auth/google', { idToken });
        if (res.success && res.data?.accessToken) {
            this.setToken(res.data.accessToken);
        }
        return res;
    }

    async verifyMFA(userId: string, token: string) {
        const res = await this.request('POST', '/auth/mfa/verify', { userId, token });
        if (res.success && res.data?.accessToken) {
            this.setToken(res.data.accessToken);
        }
        return res;
    }

    async verifyEmail(email: string, code: string) {
        const res = await this.request('POST', '/auth/verify', { email, code });
        if (res.success && res.data?.accessToken) {
            this.setToken(res.data.accessToken);
        }
        return res;
    }

    async resendVerification(email: string) {
        return this.request('POST', '/auth/resend-verification', { email });
    }

    async forgotPassword(email: string) {
        return this.request('POST', '/auth/forgot-password', { email });
    }

    async resetPassword(data: any) {
        return this.request('POST', '/auth/reset-password', data);
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
        localStorage.removeItem('token');
        localStorage.removeItem('beacon_token');
    }

    async getCurrentUser() {
        return this.request('GET', '/users/me');
    }

    async updateUser(updates: any) {
        return this.request('PATCH', '/users/me', updates);
    }

    async searchUsers(query: string) {
        return this.request('GET', `/users/search?q=${encodeURIComponent(query)}`);
    }

    async sendMessage(channelId: string, data: { content: string, attachments?: any[] }) {
        return this.request('POST', `/channels/${channelId}/messages`, data);
    }

    async getNotifications() {
        return this.request('GET', '/users/@me/notifications');
    }

    async markNotificationRead(id: string) {
        return this.request('PATCH', `/users/@me/notifications/${id}/read`);
    }

    async markAllNotificationsRead() {
        return this.request('POST', '/users/@me/notifications/read-all');
    }

    async deleteNotification(id: string) {
        return this.request('DELETE', `/users/@me/notifications/${id}`);
    }

    async clearNotifications() {
        return this.request('DELETE', '/users/@me/notifications');
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

    async submitMessageReport(data: {
        messageId: string;
        channelId: string;
        targetUserId?: string;
        reason: string;
        content?: string;
    }) {
        return this.request('POST', '/moderation/reports', {
            messageId: data.messageId,
            channelId: data.channelId,
            targetUserId: data.targetUserId,
            reason: data.reason,
            content: data.content,
        });
    }

    async submitUserReport(data: {
        targetUserId: string;
        channelId?: string;
        reason: string;
        content?: string;
    }) {
        return this.request('POST', '/moderation/reports', {
            targetUserId: data.targetUserId,
            channelId: data.channelId,
            reason: data.reason,
            content: data.content,
        });
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

    async createInvite(guildId: string) {
        return this.request('POST', `/guilds/${guildId}/invites`, {});
    }

    async deleteInvite(guildId: string, inviteCode: string) {
        return this.request('DELETE', `/guilds/${guildId}/invites/${inviteCode}`);
    }

    async joinByInvite(inviteCode: string) {
        return this.request('POST', `/guilds/invites/${encodeURIComponent(inviteCode)}/join`, {});
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
        const query = guildId ? `?guildId=${encodeURIComponent(guildId)}` : '';
        return this.request('GET', `/interactions/commands${query}`);
    }

    async getGuildRoles(guildId: string) {
        return this.request('GET', `/guilds/${guildId}/roles`);
    }

    async createGuildRole(guildId: string, data: { name: string; color?: string; permissions?: string | number }) {
        return this.request('POST', `/guilds/${guildId}/roles`, data);
    }

    async updateGuildRole(guildId: string, roleId: string, data: { name?: string; color?: string; permissions?: string | number; position?: number }) {
        return this.request('PATCH', `/guilds/${guildId}/roles/${roleId}`, data);
    }

    async deleteGuildRole(guildId: string, roleId: string) {
        return this.request('DELETE', `/guilds/${guildId}/roles/${roleId}`);
    }

    async executeInteraction(data: any) {
        return this.request('POST', '/interactions', data);
    }



}

export const apiClient = new ApiClient();
