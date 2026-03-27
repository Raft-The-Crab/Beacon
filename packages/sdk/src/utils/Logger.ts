/**
 * Logger — Centralized logging utility for the Beacon SDK and bots.
 * Supports colored output in Node.js environments and standard console in browsers.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

const Colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

export class Logger {
  public level: LogLevel = LogLevel.INFO;
  private name: string;

  constructor(name = 'Beacon') {
    this.name = name;
  }

  private _getTimestamp(): string {
    return new Date().toLocaleTimeString();
  }

  private _log(level: LogLevel, ...args: any[]) {
    if (level < this.level) return;

    const timestamp = this._getTimestamp();
    const isNode = typeof process !== 'undefined' && process.stdout && process.stdout.isTTY;

    let prefix = `[${timestamp}] [${this.name}]`;
    let color = Colors.reset;

    switch (level) {
      case LogLevel.DEBUG:
        color = Colors.magenta;
        prefix += ' [DEBUG]';
        break;
      case LogLevel.INFO:
        color = Colors.blue;
        prefix += ' [INFO]';
        break;
      case LogLevel.WARN:
        color = Colors.yellow;
        prefix += ' [WARN]';
        break;
      case LogLevel.ERROR:
        color = Colors.red;
        prefix += ' [ERROR]';
        break;
    }

    if (isNode) {
      console.log(`${Colors.dim}${prefix}${Colors.reset}`, color, ...args, Colors.reset);
    } else {
      console.log(prefix, ...args);
    }
  }

  debug(...args: any[]) { this._log(LogLevel.DEBUG, ...args); }
  info(...args: any[]) { this._log(LogLevel.INFO, ...args); }
  warn(...args: any[]) { this._log(LogLevel.WARN, ...args); }
  error(...args: any[]) { this._log(LogLevel.ERROR, ...args); }
}

export const logger = new Logger();
