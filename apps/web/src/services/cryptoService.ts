/**
 * Sovereign Security Engine (E2EE)
 * Powered by Web Crypto API
 */
export class CryptoService {
    private static ALGO_NAME = 'AES-GCM';
    private static KEY_ALGO = { name: 'ECDH', namedCurve: 'P-256' };

    /**
     * Generates a new E2EE key pair
     */
    static async generateKeyPair(): Promise<CryptoKeyPair> {
        return await window.crypto.subtle.generateKey(
            this.KEY_ALGO,
            true, // extractable
            ['deriveKey', 'deriveBits']
        );
    }

    /**
     * Exports a public key to a format suitable for sharing
     */
    static async exportPublicKey(key: CryptoKey): Promise<ArrayBuffer> {
        return await window.crypto.subtle.exportKey('spki', key);
    }

    /**
     * Derives a shared secret key using ECDH
     */
    static async deriveSharedKey(
        privateKey: CryptoKey,
        publicKey: CryptoKey
    ): Promise<CryptoKey> {
        return await window.crypto.subtle.deriveKey(
            { name: 'ECDH', public: publicKey },
            privateKey,
            { name: this.ALGO_NAME, length: 256 },
            false, // not extractable
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypts a message using a shared key
     */
    static async encrypt(
        text: string,
        key: CryptoKey
    ): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(text);

        const ciphertext = await window.crypto.subtle.encrypt(
            { name: this.ALGO_NAME, iv },
            key,
            encoded
        );

        return { ciphertext, iv };
    }

    /**
     * Decrypts a message using a shared key
     */
    static async decrypt(
        ciphertext: ArrayBuffer,
        key: CryptoKey,
        iv: Uint8Array
    ): Promise<string> {
        const decrypted = await window.crypto.subtle.decrypt(
            { name: this.ALGO_NAME, iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    }

    /**
     * Helper to convert ArrayBuffer to Base64
     */
    static arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Helper to convert Base64 to ArrayBuffer
     */
    static base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
}
