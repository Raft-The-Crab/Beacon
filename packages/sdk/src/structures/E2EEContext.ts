/**
 * E2EEContext — Handles End-to-End Encryption logic.
 * Isomorphic: Uses Node.js crypto when available, otherwise falls back to Web Crypto or stubs.
 */

export class E2EEContext {
  constructor(_publicKey?: string, _privateKey?: string) {}

  /** Generates a new X25519 keypair for E2EE */
  public static async generateKeyPair() {
    if (typeof window === 'undefined') {
      // Node.js
      const crypto = await import(/* @vite-ignore */ 'node:crypto');
      const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519', {
        publicKeyEncoding: { type: 'spki', format: 'der' },
        privateKeyEncoding: { type: 'pkcs8', format: 'der' }
      });
      return {
        publicKey: publicKey.toString('base64'),
        privateKey: privateKey.toString('base64')
      };
    } else {
      // Browser - X25519 support in subtle crypto is limited in some browsers, 
      // but we use crypto-browserify as a polyfill in the vite config.
      const crypto = (await import(/* @vite-ignore */ 'crypto')).default || await import(/* @vite-ignore */ 'crypto');
      const { publicKey, privateKey } = (crypto as any).generateKeyPairSync('x25519', {
        publicKeyEncoding: { type: 'spki', format: 'der' },
        privateKeyEncoding: { type: 'pkcs8', format: 'der' }
      });
      return {
        publicKey: (publicKey as any).toString('base64'),
        privateKey: (privateKey as any).toString('base64')
      };
    }
  }

  private static async getCrypto() {
    if (typeof window === 'undefined') {
      return await import(/* @vite-ignore */ 'node:crypto');
    }
    // In browser, we expect 'crypto' to be polyfilled or available globally
    return (await import(/* @vite-ignore */ 'crypto')).default || await import(/* @vite-ignore */ 'crypto');
  }

  public async encrypt(content: string, recipientPublicKeyBase64: string, privateKeyBase64: string): Promise<string> {
    const crypto = await E2EEContext.getCrypto();
    const privKey = crypto.createPrivateKey({
      key: Buffer.from(privateKeyBase64, 'base64'),
      format: 'der',
      type: 'pkcs8'
    });
    const pubKey = crypto.createPublicKey({
      key: Buffer.from(recipientPublicKeyBase64, 'base64'),
      format: 'der',
      type: 'spki'
    });

    const sharedSecret = crypto.diffieHellman({
      privateKey: privKey,
      publicKey: pubKey
    });

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', sharedSecret, iv);
    
    let encrypted = cipher.update(content, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag().toString('base64');
    return `${iv.toString('base64')}:${authTag}:${encrypted}`;
  }

  public async decrypt(encryptedData: string, senderPublicKeyBase64: string, privateKeyBase64: string): Promise<string> {
    const crypto = await E2EEContext.getCrypto();
    const [ivBase64, authTagBase64, contentBase64] = encryptedData.split(':');
    if (!ivBase64 || !authTagBase64 || !contentBase64) return encryptedData;

    const privKey = crypto.createPrivateKey({
      key: Buffer.from(privateKeyBase64, 'base64'),
      format: 'der',
      type: 'pkcs8'
    });
    const pubKey = crypto.createPublicKey({
      key: Buffer.from(senderPublicKeyBase64, 'base64'),
      format: 'der',
      type: 'spki'
    });

    const sharedSecret = crypto.diffieHellman({
      privateKey: privKey,
      publicKey: pubKey
    });

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm', 
      sharedSecret, 
      Buffer.from(ivBase64, 'base64')
    );
    
    decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));

    let decrypted = decipher.update(contentBase64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
