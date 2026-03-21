import * as crypto from 'node:crypto';

export class E2EEContext {
  constructor(_publicKey?: string, _privateKey?: string) {
    // In a real high-end impl, we'd use KeyObjects, but we'll use base64 for now
  }

  /** Generates a new X25519 keypair for E2EE */
  public static generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519', {
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' }
    });
    return {
      publicKey: publicKey.toString('base64'),
      privateKey: privateKey.toString('base64')
    };
  }

  /**
   * Encrypt content using a shared secret derived via ECDH
   * High-End Logic: AES-256-GCM for authenticated encryption
   */
  public async encrypt(content: string, recipientPublicKeyBase64: string, privateKeyBase64: string): Promise<string> {
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

    // Derive shared secret
    const sharedSecret = crypto.diffieHellman({
      privateKey: privKey,
      publicKey: pubKey
    });

    // Encrypt using AES-GCM
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', sharedSecret, iv);
    
    let encrypted = cipher.update(content, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag().toString('base64');

    // Package as IV:Tag:Content
    return `${iv.toString('base64')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt content using a shared secret derived via ECDH
   */
  public async decrypt(encryptedData: string, senderPublicKeyBase64: string, privateKeyBase64: string): Promise<string> {
    const [ivBase64, authTagBase64, contentBase64] = encryptedData.split(':');
    if (!ivBase64 || !authTagBase64 || !contentBase64) return encryptedData; // Fallback

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
