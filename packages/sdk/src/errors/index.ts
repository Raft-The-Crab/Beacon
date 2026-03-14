/**
 * Beacon SDK — Error hierarchy
 * All SDK errors extend BeaconError so callers can catch one base type.
 */

export class BeaconError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }
}

/** Thrown when the HTTP layer returns a non-2xx status from the Beacon API. */
export class BeaconAPIError extends BeaconError {
  public readonly status: number;
  public readonly code: number | undefined;
  public readonly response: Record<string, any>;

  constructor(status: number, message: string, response: Record<string, any> = {}) {
    super(`HTTP ${status}: ${message}`);
    this.status = status;
    this.code = response.code;
    this.response = response;
  }

  get isClientError() { return this.status >= 400 && this.status < 500; }
  get isServerError() { return this.status >= 500; }
  get isUnauthorized() { return this.status === 401; }
  get isForbidden() { return this.status === 403; }
  get isNotFound() { return this.status === 404; }
}

/** Thrown when a route or global rate-limit has been exceeded. */
export class RateLimitError extends BeaconAPIError {
  public readonly retryAfter: number;
  public readonly isGlobal: boolean;
  public readonly route: string;

  constructor(retryAfterMs: number, route: string, isGlobal = false) {
    super(429, `Rate limited on ${route} — retry after ${retryAfterMs}ms`);
    this.retryAfter = retryAfterMs;
    this.route = route;
    this.isGlobal = isGlobal;
  }
}

/** Thrown when the WebSocket connection fails or closes non-recoverably. */
export class GatewayError extends BeaconError {
  public readonly code: number | undefined;
  constructor(message: string, code?: number) {
    super(message);
    this.code = code;
  }
}

/** Thrown when the bot token is rejected or has insufficient permissions. */
export class AuthenticationError extends BeaconError {
  constructor(message = 'Invalid or missing bot token') {
    super(message);
  }
}

/** Thrown when a required argument, option, or permission is missing. */
export class ValidationError extends BeaconError {
  public readonly field: string | undefined;
  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

/** Thrown when a shard encounters a fatal issue. */
export class ShardError extends BeaconError {
  public readonly shardId: number;
  constructor(shardId: number, message: string) {
    super(`[Shard ${shardId}] ${message}`);
    this.shardId = shardId;
  }
}

/** Thrown when a command handler or component interaction times out. */
export class TimeoutError extends BeaconError {
  constructor(label = 'Operation') {
    super(`${label} timed out`);
  }
}

/** Thrown when a file upload fails. */
export class UploadError extends BeaconError {
  constructor(message: string) {
    super(`File upload failed: ${message}`);
  }
}
