/**
 * location-monitor - Logger Utility
 * Created by: Mohammed Mustafa (Senior Backend Engineer)
 * 
 * Configurable logging utility with support for multiple outputs
 */

import * as fs from 'fs';
import * as path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  level: LogLevel;
  json: boolean;
  console: boolean;
  filePath?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private options: LoggerOptions;
  private fileStream?: fs.WriteStream;

  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = {
      level: options.level || 'info',
      json: options.json || false,
      console: options.console !== false,
      filePath: options.filePath,
    };

    if (this.options.filePath) {
      this.initializeFileStream();
    }
  }

  private initializeFileStream(): void {
    if (!this.options.filePath) return;

    const dir = path.dirname(this.options.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.fileStream = fs.createWriteStream(this.options.filePath, { flags: 'a' });
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.options.level];
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, any>): string {
    const timestamp = new Date().toISOString();

    if (this.options.json) {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta,
      });
    }

    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  private write(level: LogLevel, message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);

    if (this.options.console) {
      const consoleMethod = level === 'error' ? console.error : 
                           level === 'warn' ? console.warn : 
                           console.log;
      consoleMethod(formattedMessage);
    }

    if (this.fileStream) {
      this.fileStream.write(formattedMessage + '\n');
    }
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.write('debug', message, meta);
  }

  info(message: string, meta?: Record<string, any>): void {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.write('warn', message, meta);
  }

  error(message: string, error?: Error | Record<string, any>): void {
    const meta = error instanceof Error 
      ? { error: error.message, stack: error.stack }
      : error;
    this.write('error', message, meta);
  }

  close(): void {
    if (this.fileStream) {
      this.fileStream.end();
    }
  }
}

// Singleton instance
let globalLogger: Logger;

export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger();
  }
  return globalLogger;
}

export function setLogger(logger: Logger): void {
  globalLogger = logger;
}
