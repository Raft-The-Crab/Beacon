/**
 * UserManager — User discovery, profile management, and global search.
 */
import { RestClient } from '../rest/RestClient';
import { User } from '../structures/User';
import { TTLCache } from '../cache/TTLCache';
import type { RawUser } from '../types/index';

export class UserManager {
    public readonly cache: TTLCache<string, User>;

    constructor(private rest: RestClient) {
        this.cache = new TTLCache<string, User>(3600000, 1000); // 1 hour TTL
    }

    /** Fetch a user by ID (hits cache first) */
    async fetch(userId: string, force = false): Promise<User> {
        if (!force) {
            const cached = this.cache.get(userId);
            if (cached) return cached;
        }
        const data = await this.rest.getUser(userId);
        const user = new User(this.rest.client, data);
        this.cache.set(userId, user);
        return user;
    }

    /** Search for users globally on Beacon */
    async search(query: string, options: { limit?: number; offset?: number } = {}): Promise<User[]> {
        const params = new URLSearchParams({ q: query });
        if (options.limit) params.set('limit', String(options.limit));
        if (options.offset) params.set('offset', String(options.offset));

        const data = await this.rest.get<RawUser[]>(`/users/search?${params}`);
        return data.map(d => {
            const user = new User(this.rest.client, d);
            this.cache.set(user.id, user);
            return user;
        });
    }

    /** Edit the current bot/user profile */
    async editProfile(data: { username?: string; avatar?: string; bio?: string; nameDesign?: Record<string, any> }): Promise<User> {
        const payload = {
            username: data.username,
            avatar: data.avatar,
            bio: data.bio,
            name_design: data.nameDesign
        };
        const updated = await this.rest.patch<RawUser>('/users/@me', payload);
        const user = new User(this.rest.client, updated);
        this.cache.set(user.id, user);
        return user;
    }

    /** Bulk fetch users to rapidly populate caches (e.g. for message history) */
    async bulkFetch(userIds: string[], chunkSize = 50): Promise<User[]> {
        const results: User[] = [];
        for (let i = 0; i < userIds.length; i += chunkSize) {
            const chunk = userIds.slice(i, i + chunkSize);
            const promises = chunk.map(id => this.fetch(id).catch(() => null));
            const chunkRes = await Promise.all(promises);
            results.push(...(chunkRes.filter(Boolean) as User[]));
        }
        return results;
    }
}
