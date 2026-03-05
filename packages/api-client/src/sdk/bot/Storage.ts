export interface StorageProvider {
    get(key: string): Promise<any>
    set(key: string, value: any): Promise<void>
    delete(key: string): Promise<void>
    clear(): Promise<void>
}

export class MemoryStorageProvider implements StorageProvider {
    private data = new Map<string, any>()

    async get(key: string) { return this.data.get(key) }
    async set(key: string, value: any) { this.data.set(key, value) }
    async delete(key: string) { this.data.delete(key) }
    async clear() { this.data.clear() }
}

export class BotStorage {
    constructor(private provider: StorageProvider, private namespace: string) { }

    private key(k: string) { return `${this.namespace}:${k}` }

    async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
        const val = await this.provider.get(this.key(key))
        return val !== undefined ? val : defaultValue
    }

    async set(key: string, value: any): Promise<void> {
        await this.provider.set(this.key(key), value)
    }

    async delete(key: string): Promise<void> {
        await this.provider.delete(this.key(key))
    }
}
