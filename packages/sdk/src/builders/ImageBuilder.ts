/**
 * ImageBuilder — Zero-dependency utility for dynamic UI generation.
 * (Mock implementation for now, providing the interface for levels and banners)
 */
export class ImageBuilder {
    private _type: 'level' | 'banner' | 'graph' = 'level';
    private _data: any = {};

    public setType(type: 'level' | 'banner' | 'graph'): this {
        this._type = type;
        return this;
    }

    public setData(data: any): this {
        this._data = { ...this._data, ...data };
        return this;
    }

    /**
     * In a full implementation, this would use a canvas-like API or SVG generation.
     * For the Beacon SDK, it generates a dynamic URL for the Beacon Image Service.
     */
    public buildURL(): string {
        const params = new URLSearchParams(this._data).toString();
        return `https://images.beacon.qzz.io/v1/${this._type}?${params}`;
    }

    public toEmbed(): any {
        return {
            image: { url: this.buildURL() }
        };
    }
}
