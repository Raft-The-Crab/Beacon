/**
 * ScheduledTask — Cron-like recurring task scheduler for bot routines.
 * Supports interval-based ("every X ms") and time-of-day ("at HH:MM UTC") scheduling.
 */

export type TaskFn = () => void | Promise<void>;

export interface TaskOptions {
  /** Human-readable name for the task (used in logs and removal). */
  name: string;
  /** Run the task once immediately on registration before the first interval tick. */
  runImmediately?: boolean;
  /** Max number of executions before the task auto-removes itself. Omit for indefinite. */
  maxRuns?: number;
}

export interface IntervalTaskOptions extends TaskOptions {
  type: 'interval';
  /** Interval in milliseconds between executions. */
  intervalMs: number;
}

export interface CronTaskOptions extends TaskOptions {
  type: 'cron';
  /**
   * Simplified cron expression — supports:
   *   "every Xms"              e.g. "every 5000ms"
   *   "every Xs"               e.g. "every 10s"
   *   "every Xm"               e.g. "every 5m"
   *   "every Xh"               e.g. "every 1h"
   *   "at HH:MM"               e.g. "at 12:00" (daily at that UTC time)
   */
  schedule: string;
}

interface ActiveTask {
  name: string;
  fn: TaskFn;
  timer: ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>;
  runs: number;
  maxRuns?: number;
  createdAt: Date;
  type: 'interval' | 'daily';
}

function parseSchedule(schedule: string): { type: 'interval'; ms: number } | { type: 'daily'; hours: number; minutes: number } {
  const every = schedule.match(/^every\s+(\d+(?:\.\d+)?)(ms|s|m|h)$/i);
  if (every) {
    const value = parseFloat(every[1]);
    const unit = every[2].toLowerCase();
    const multis: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 };
    return { type: 'interval', ms: value * multis[unit] };
  }

  const at = schedule.match(/^at\s+(\d{1,2}):(\d{2})$/i);
  if (at) {
    return { type: 'daily', hours: parseInt(at[1], 10), minutes: parseInt(at[2], 10) };
  }

  throw new Error(`Unsupported schedule format: "${schedule}". Supported: "every Xms/s/m/h" or "at HH:MM"`);
}

export class ScheduledTaskManager {
  private tasks: Map<string, ActiveTask> = new Map();

  /**
   * Register an interval-based task.
   */
  addInterval(options: IntervalTaskOptions, fn: TaskFn): this {
    return this._registerInterval(options.name, fn, options.intervalMs, options);
  }

  /**
   * Register a task using a human-readable schedule string.
   * Supports: "every 5s", "every 10m", "every 1h", "at 08:00"
   */
  addSchedule(options: CronTaskOptions, fn: TaskFn): this {
    const parsed = parseSchedule(options.schedule);
    if (parsed.type === 'interval') {
      return this._registerInterval(options.name, fn, parsed.ms, options);
    }
    return this._registerDaily(options.name, fn, parsed.hours, parsed.minutes, options);
  }

  private _registerInterval(name: string, fn: TaskFn, intervalMs: number, options: TaskOptions): this {
    if (this.tasks.has(name)) throw new Error(`Task '${name}' is already registered`);

    let runs = 0;
    const maxRuns = options.maxRuns;

    const execute = async () => {
      runs++;
      try {
        await fn();
      } catch (err) {
        // Swallow errors to keep the scheduler alive; consumers should handle in fn
      }
      if (maxRuns !== undefined && runs >= maxRuns) {
        this.remove(name);
      }
    };

    if (options.runImmediately) execute();

    const timer = setInterval(execute, intervalMs);
    this.tasks.set(name, {
      name,
      fn,
      timer,
      runs: 0,
      maxRuns,
      createdAt: new Date(),
      type: 'interval',
    });
    return this;
  }

  private _registerDaily(name: string, fn: TaskFn, hours: number, minutes: number, options: TaskOptions): this {
    if (this.tasks.has(name)) throw new Error(`Task '${name}' is already registered`);

    let runs = 0;
    const maxRuns = options.maxRuns;

    const scheduleNext = () => {
      const now = new Date();
      const next = new Date();
      next.setUTCHours(hours, minutes, 0, 0);
      if (next <= now) next.setUTCDate(next.getUTCDate() + 1); // next day

      const delay = next.getTime() - now.getTime();
      const timer = setTimeout(async () => {
        runs++;
        try { await fn(); } catch {}
        if (maxRuns !== undefined && runs >= maxRuns) {
          this.remove(name);
          return;
        }
        // Reschedule for the next day
        const existing = this.tasks.get(name);
        if (existing) {
          existing.runs = runs;
          scheduleNext();
        }
      }, delay);

      const existing = this.tasks.get(name);
      if (existing) {
        clearTimeout(existing.timer as ReturnType<typeof setTimeout>);
        existing.timer = timer;
      } else {
        this.tasks.set(name, { name, fn, timer, runs: 0, maxRuns, createdAt: new Date(), type: 'daily' });
      }
    };

    scheduleNext();
    if (options.runImmediately) Promise.resolve(fn()).catch(() => {});
    return this;
  }

  /** Remove and cancel a task by name. Returns false if not found. */
  remove(name: string): boolean {
    const task = this.tasks.get(name);
    if (!task) return false;
    if (task.type === 'interval') clearInterval(task.timer as ReturnType<typeof setInterval>);
    else clearTimeout(task.timer as ReturnType<typeof setTimeout>);
    this.tasks.delete(name);
    return true;
  }

  /** Returns whether a task is currently registered. */
  has(name: string): boolean {
    return this.tasks.has(name);
  }

  /** Snapshot of all active tasks. */
  get status(): Array<{ name: string; runs: number; maxRuns?: number; createdAt: Date; type: string }> {
    return [...this.tasks.values()].map(({ name, runs, maxRuns, createdAt, type }) => ({
      name, runs, maxRuns, createdAt, type,
    }));
  }

  /** Total number of registered tasks. */
  get count(): number {
    return this.tasks.size;
  }

  /** Cancel all tasks and clear the registry. */
  destroy(): void {
    for (const task of this.tasks.values()) {
      if (task.type === 'interval') clearInterval(task.timer as ReturnType<typeof setInterval>);
      else clearTimeout(task.timer as ReturnType<typeof setTimeout>);
    }
    this.tasks.clear();
  }
}
