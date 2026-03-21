/**
 * EventRouter — Pattern-based routing for bot events.
 *
 * Provides a declarative, Express-style router for gateway events.
 * Supports prefix matching, regex matching, wildcard listeners, and
 * route guards (middleware per route).
 *
 * @example
 * ```ts
 * const router = new EventRouter(client);
 *
 * // Route messages starting with "!"
 * router.message(msg => msg.content.startsWith('!'), async msg => {
 *   const [cmd, ...args] = msg.content.slice(1).split(' ');
 *   await msg.channel?.sendMessage({ content: `Command: ${cmd}` });
 * });
 *
 * // Route component interactions by customId prefix
 * router.component('confirm:', async ctx => {
 *   await ctx.deferUpdate();
 *   // ...
 * });
 *
 * router.attach(); // start listening on the client
 * ```
 */

import EventEmitter from 'eventemitter3';

export type RouteGuard<T> = (payload: T) => boolean | Promise<boolean>;
export type RouteHandler<T> = (payload: T) => void | Promise<void>;

interface Route<T> {
  guard: RouteGuard<T>;
  handler: RouteHandler<T>;
}

export class EventRouter {
  private _emitter: EventEmitter;
  private _messageRoutes: Route<any>[] = [];
  private _componentRoutes: Route<any>[] = [];
  private _modalRoutes: Route<any>[] = [];
  private _reactionRoutes: Route<any>[] = [];
  private _guildMemberRoutes: Route<any>[] = [];
  private _attached = false;

  constructor(emitter: EventEmitter) {
    this._emitter = emitter;
  }

  // ─── Message routing ──────────────────────────────────────────

  /**
   * Route a message event when the guard returns true.
   * @param guard   A filter function or a string prefix to match against message content.
   * @param handler Handler to invoke.
   */
  message(guard: string | RegExp | RouteGuard<any>, handler: RouteHandler<any>): this {
    const resolved = this._resolveGuard(guard, (msg: any) => msg.content ?? '');
    this._messageRoutes.push({ guard: resolved, handler });
    return this;
  }

  // ─── Component (button / select) routing ──────────────────────

  /**
   * Route a component interaction by customId prefix, regex, or an arbitrary guard.
   */
  component(guard: string | RegExp | RouteGuard<any>, handler: RouteHandler<any>): this {
    const resolved = this._resolveGuard(guard, (ctx: any) => ctx.customId ?? '');
    this._componentRoutes.push({ guard: resolved, handler });
    return this;
  }

  // ─── Modal submit routing ─────────────────────────────────────

  /**
   * Route a modal submission by customId prefix, regex, or an arbitrary guard.
   */
  modal(guard: string | RegExp | RouteGuard<any>, handler: RouteHandler<any>): this {
    const resolved = this._resolveGuard(guard, (ctx: any) => ctx.customId ?? '');
    this._modalRoutes.push({ guard: resolved, handler });
    return this;
  }

  // ─── Reaction routing ─────────────────────────────────────────

  /**
   * Route a reaction add event by emoji name/id prefix, regex, or guard.
   */
  reaction(guard: string | RegExp | RouteGuard<any>, handler: RouteHandler<any>): this {
    const resolved = this._resolveGuard(guard, (evt: any) => evt.emoji?.name ?? evt.emoji?.id ?? '');
    this._reactionRoutes.push({ guard: resolved, handler });
    return this;
  }

  // ─── Guild member routing ─────────────────────────────────────

  /** Route guild member add events through a guard. */
  guildMemberAdd(guard: RouteGuard<any>, handler: RouteHandler<any>): this {
    this._guildMemberRoutes.push({ guard, handler });
    return this;
  }

  // ─── Attach / detach ──────────────────────────────────────────

  /** Start listening on the client EventEmitter. Idempotent. */
  attach(): this {
    if (this._attached) return this;
    this._attached = true;

    this._emitter.on('messageCreate', (msg: any) => this._dispatch(this._messageRoutes, msg));
    this._emitter.on('componentInteraction', (ctx: any) => this._dispatch(this._componentRoutes, ctx));
    this._emitter.on('modalSubmit', (ctx: any) => this._dispatch(this._modalRoutes, ctx));
    this._emitter.on('messageReactionAdd', (data: any) => this._dispatch(this._reactionRoutes, data));
    this._emitter.on('guildMemberAdd', (member: any) => this._dispatch(this._guildMemberRoutes, member));
    return this;
  }

  /** Stop listening and remove all internal listeners from the emitter. */
  detach(): this {
    this._emitter.removeAllListeners('messageCreate');
    this._emitter.removeAllListeners('componentInteraction');
    this._emitter.removeAllListeners('modalSubmit');
    this._emitter.removeAllListeners('messageReactionAdd');
    this._emitter.removeAllListeners('guildMemberAdd');
    this._attached = false;
    return this;
  }

  // ─── Internals ────────────────────────────────────────────────

  private _resolveGuard<T>(
    guard: string | RegExp | RouteGuard<T>,
    extractor: (payload: T) => string
  ): RouteGuard<T> {
    if (typeof guard === 'string') {
      return (payload: T) => extractor(payload).startsWith(guard);
    }
    if (guard instanceof RegExp) {
      return (payload: T) => guard.test(extractor(payload));
    }
    return guard;
  }

  private async _dispatch<T>(routes: Route<T>[], payload: T): Promise<void> {
    for (const route of routes) {
      let matched: boolean;
      try {
        matched = await Promise.resolve(route.guard(payload));
      } catch {
        continue;
      }
      if (matched) {
        Promise.resolve(route.handler(payload)).catch(() => {});
        return; // first-match routing — use multiple routers for multi-dispatch
      }
    }
  }

  /** Number of registered routes across all event types. */
  get routeCount(): number {
    return this._messageRoutes.length +
      this._componentRoutes.length +
      this._modalRoutes.length +
      this._reactionRoutes.length +
      this._guildMemberRoutes.length;
  }

  /** Clear all registered routes (but keep the event listener attachment). */
  clearRoutes(): this {
    this._messageRoutes = [];
    this._componentRoutes = [];
    this._modalRoutes = [];
    this._reactionRoutes = [];
    this._guildMemberRoutes = [];
    return this;
  }
}
