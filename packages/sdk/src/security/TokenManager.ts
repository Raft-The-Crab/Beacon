/**
 * TokenManager — Handles token lifecycle, rotation, and adaptive refreshing.
 */

export interface TokenInfo {
  token: string;
  expiresIn: number; // seconds
  refreshToken?: string;
}

export class TokenManager {
  private currentToken: string | null = null;
  private expiresAt: number = 0;
  private refreshInterval: any = null;
  private refreshCallback?: () => Promise<void>;

  constructor(token?: string) {
    if (token) this.currentToken = token;
  }

  setToken(info: TokenInfo) {
    this.currentToken = info.token;
    this.expiresAt = Date.now() + (info.expiresIn * 1000);
    
    // Schedule proactive refresh 1 minute before expiry
    this._scheduleRefresh();
  }

  getToken(): string | null {
    // If expired, we should have refreshed already, but return null if still expired
    if (Date.now() >= this.expiresAt && this.expiresAt !== 0) return null;
    return this.currentToken;
  }

  get isExpired(): boolean {
    return this.expiresAt !== 0 && Date.now() >= this.expiresAt;
  }

  setRefreshCallback(callback: () => Promise<void>) {
    this.refreshCallback = callback;
  }

  private _scheduleRefresh() {
    if (this.refreshInterval) clearTimeout(this.refreshInterval);
    
    // Add random jitter (0-5s) to avoid thundering herd on mass expiry
    const jitter = Math.floor(Math.random() * 5000);
    const delay = (this.expiresAt - Date.now()) - 60000 + jitter; // ~1 min before
    if (delay > 0) {
      this.refreshInterval = setTimeout(async () => {
        try {
          if (this.refreshCallback) await this.refreshCallback();
        } catch (e) {
          console.error('[TokenManager] Proactive token refresh failed:', e);
        }
      }, delay);
      
      if (this.refreshInterval.unref) this.refreshInterval.unref();
    }
  }
}
