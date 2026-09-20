/**
 * Module-scoped logger handed out by `LoggingService.createLogger`.
 */
export type TaggedLogger = {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
};

/**
 * Receives raw log entries so they can be forwarded to an external service.
 * Entries carry unformatted data (no ANSI/CSS).
 */
export type LogSink = (entry: LogEntry) => void;

export type LogEntry = {
  level: LogLevel;
  tag: string;
  message: string;
  args: unknown[];
  timestampMs: number;
};

export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error'
}

/**
 * Structured log data. Only primitives are allowed because that is the common denominator
 * across structured logging backends.
 */
export type LogAttributes = Record<string, string | number | boolean>;
