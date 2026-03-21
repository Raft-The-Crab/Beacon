import { RestClient } from '../rest/RestClient';
import { TTLCache } from '../cache/TTLCache';

export interface RoleData {
    id: string;
    name: string;
    color: number;
    hoist: boolean;
    position: number;
    permissions: string;
    managed: boolean;
    mentionable: boolean;
}

export class RoleManager {
    public cache: TTLCache<string, RoleData> = new TTLCache<string, RoleData>(3600000, 100);

    constructor(private rest: RestClient, public guildId: string) {}

    async fetch(): Promise<RoleData[]> {
        const roles = await this.rest.getGuildRoles(this.guildId);
        for (const role of roles) {
            this.cache.set(role.id, role as any);
        }
        return roles as any;
    }

    async create(data: Partial<RoleData>): Promise<RoleData> {
        const role = await this.rest.createGuildRole(this.guildId, data);
        this.cache.set(role.id, role as any);
        return role as any;
    }

    async delete(roleId: string): Promise<void> {
        await this.rest.request('DELETE', `/guilds/${this.guildId}/roles/${roleId}`);
        this.cache.delete(roleId);
    }
}
