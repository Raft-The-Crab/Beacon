/**
 * Parses an object and converts any BigInt values into strings recursively,
 * so they can be serialized correctly via res.json() without type errors.
 */
export function serializeBigInt<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'bigint') {
        return obj.toString() as unknown as T;
    }

    if (Array.isArray(obj)) {
        return obj.map(serializeBigInt) as unknown as T;
    }

    if (typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = serializeBigInt(value);
        }
        return result as T;
    }

    return obj;
}
