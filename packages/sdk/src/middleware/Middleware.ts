/**
 * Middleware pipeline for the Beacon bot Client.
 * Each middleware is async and receives the event name + payload.
 * A middleware can transform the payload or short-circuit further handling.
 */

export type MiddlewareFn<T = any> = (
  event: string,
  payload: T,
  next: () => Promise<void>
) => void | Promise<void>;

export class MiddlewarePipeline {
  private fns: MiddlewareFn[] = [];

  /** Register a middleware (runs in registration order). */
  use(fn: MiddlewareFn): this {
    this.fns.push(fn);
    return this;
  }

  /** Run the pipeline for a given event + payload. Returns false if short-circuited. */
  async run(event: string, payload: any): Promise<boolean> {
    let index = 0;
    const fns = this.fns;

    async function dispatch(): Promise<void> {
      if (index >= fns.length) return;
      const fn = fns[index++];
      await fn(event, payload, dispatch);
    }

    try {
      await dispatch();
      return true;
    } catch (err) {
      throw err;
    }
  }

  /** Number of registered middlewares. */
  get size() { return this.fns.length; }

  /** Remove all middlewares. */
  clear() { this.fns = []; }
}

// ─── Bundled middleware factories ─────────────────────────────────────────────

/** Log every event to the given logger function. */
export function loggerMiddleware(
  logger: (msg: string) => void = console.log
): MiddlewareFn {
  return async (event, _payload, next) => {
    const start = Date.now();
    await next();
    logger(`[beacon.js] ${event} (${Date.now() - start}ms)`);
  };
}

/** Ignore events from specific guild IDs. */
export function guildAllowlistMiddleware(allowedGuildIds: string[]): MiddlewareFn {
  const set = new Set(allowedGuildIds);
  return async (_event, payload, next) => {
    const guildId: string | undefined = payload?.guildId ?? payload?.guild_id;
    if (guildId && !set.has(guildId)) return; // drop
    await next();
  };
}

/** Block events coming from specific user IDs (e.g. bots the bot shouldn't respond to). */
export function userBlocklistMiddleware(blockedUserIds: string[]): MiddlewareFn {
  const set = new Set(blockedUserIds);
  return async (_event, payload, next) => {
    const userId: string | undefined =
      payload?.author?.id ?? payload?.userId ?? payload?.user?.id;
    if (userId && set.has(userId)) return;
    await next();
  };
}

/** Only process events from messages that aren't from bots. */
export function ignoreBotMessagesMiddleware(): MiddlewareFn {
  return async (event, payload, next) => {
    if (event === 'messageCreate' && payload?.author?.bot) return;
    await next();
  };
}
