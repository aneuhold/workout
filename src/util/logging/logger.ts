import { getConsoleFormatForTag } from '$util/logging/colors';

/**
 * Create a module-scoped logger.
 *
 * @param tag Logger identifier (typically a filename)
 */
export function createLogger(tag: string) {
  return {
    debug: (message: string, ...args: unknown[]): void => {
      writeLog(LogLevel.Debug, tag, message, args);
    },
    info: (message: string, ...args: unknown[]): void => {
      writeLog(LogLevel.Info, tag, message, args);
    },
    warn: (message: string, ...args: unknown[]): void => {
      writeLog(LogLevel.Warn, tag, message, args);
    },
    error: (message: string, ...args: unknown[]): void => {
      writeLog(LogLevel.Error, tag, message, args);
    }
  };
}

/**
 * Register a sink to forward raw log entries to an external service.
 * The sink receives unformatted data (no ANSI/CSS).
 *
 * @param sink Sink function, or null to disable
 */
export const setLogSink = (sink: LogSink | null): void => {
  logSink = sink;
};

enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error'
}

type LogSink = (entry: LogEntry) => void;

type LogEntry = {
  level: LogLevel;
  tag: string;
  message: string;
  args: unknown[];
  timestampMs: number;
};

let logSink: LogSink | null = null;

const writeLog = (level: LogLevel, tag: string, message: string, args: unknown[]): void => {
  if (!shouldLog(level)) {
    return;
  }

  const entry: LogEntry = {
    level,
    tag,
    message,
    args,
    timestampMs: Date.now()
  };

  logSink?.(entry);

  const format = getConsoleFormatForTag(tag);

  const targetConsole = console;

  if (format.kind === 'node-ansi') {
    const label = `${format.prefix}${tag}${format.suffix}`;
    const prefix = `[${label}]`;
    writeToConsole(targetConsole, level, prefix, message, args);
    return;
  }

  // Browser consoles can render CSS styles via %c.
  const prefix = `%c[${format.label}]%c`;
  writeToConsole(targetConsole, level, prefix, message, args, format.labelStyle, format.resetStyle);
};

const shouldLog = (level: LogLevel): boolean => {
  const minLevel = getMinLevel();
  return levelToNumber(level) >= levelToNumber(minLevel);
};

const getMinLevel = (): LogLevel => {
  // Requirement: only pay attention to the CI flag Vitest uses for now.
  // In Vitest, `process.env.VITEST` is set.
  const isVitest = Boolean(getEnvVar('VITEST')) || Boolean(getEnvVar('STORYBOOK_VITEST'));
  return isVitest ? LogLevel.Warn : LogLevel.Debug;
};

const getEnvVar = (name: string): string | undefined => {
  const nodeProcess = (globalThis as unknown as { process?: unknown }).process as
    | { env?: Record<string, string | undefined> }
    | undefined;

  return nodeProcess?.env?.[name];
};

const levelToNumber = (level: LogLevel): number => {
  switch (level) {
    case LogLevel.Debug:
      return 10;
    case LogLevel.Info:
      return 20;
    case LogLevel.Warn:
      return 30;
    case LogLevel.Error:
      return 40;
  }
};

const writeToConsole = (
  targetConsole: Console,
  level: LogLevel,
  tagPrefix: string,
  message: string,
  args: unknown[],
  ...styleArgs: string[]
): void => {
  const fullMessage = `${tagPrefix} ${message}`;

  switch (level) {
    case LogLevel.Debug:
      targetConsole.log(fullMessage, ...styleArgs, ...args);
      return;
    case LogLevel.Info:
      targetConsole.info(fullMessage, ...styleArgs, ...args);
      return;
    case LogLevel.Warn:
      targetConsole.warn(fullMessage, ...styleArgs, ...args);
      return;
    case LogLevel.Error:
      targetConsole.error(fullMessage, ...styleArgs, ...args);
      return;
  }
};
