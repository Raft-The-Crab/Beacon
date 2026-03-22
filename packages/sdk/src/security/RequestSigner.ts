/**
 * RequestSigner — Cryptographically signs outgoing request payloads.
 * Ensures data integrity and prevents tampering.
 * Works on both Node.js (crypto module) and Browser (Web Crypto API).
 */

export class RequestSigner {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  /**
   * Generates a HMAC-SHA256 signature for the given payload.
   */
  async sign(payload: string, timestamp: number): Promise<string> {
    const data = `${timestamp}.${payload}`;
    
    // Cross-platform hashing logic
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // Browser / Web Crypto
      const encoder = new TextEncoder();
      const keyData = encoder.encode(this.secret);
      const msgData = encoder.encode(data);
      
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign('HMAC', key, msgData);
      return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      // Node.js
      const nodeCrypto = await import(/* @vite-ignore */ 'crypto');
      return nodeCrypto.createHmac('sha256', this.secret)
        .update(data)
        .digest('hex');
    }
  }

  /**
   * Verifies a signature (useful for webhooks or server-to-server).
   */
  async verify(payload: string, timestamp: number, signature: string): Promise<boolean> {
    const expected = await this.sign(payload, timestamp);
    return expected === signature;
  }
}
