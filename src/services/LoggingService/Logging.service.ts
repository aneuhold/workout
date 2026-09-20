import ConsoleLoggingService from '$services/LoggingService/ConsoleLogging.service';
import {
  type LogAttributes,
  type LogEntry,
  LogLevel,
  type LogSink,
  type TaggedLogger
} from '$services/LoggingService/types';

/**
 * Hands out tagged loggers, filters entries by level, then forwards each surviving entry to
 * the console and to an optional sink.
 */
class LoggingService {
  /**
   * Backends drop attribute values beyond a size budget, and call sites pass whole documents,
   * so each serialized argument is clamped to this many characters.
   */
  static readonly #maxAttributeLength = 2000;

  #sink: LogSink | null = null;

  /**
   * Create a module-scoped logger.
   *
   * @param tag Logger identifier (typically a filename)
   */
  createLogger(tag: string): TaggedLogger {
    return {
      debug: (message, ...args) => this.#write(LogLevel.Debug, tag, message, args),
      info: (message, ...args) => this.#write(LogLevel.Info, tag, message, args),
      warn: (message, ...args) => this.#write(LogLevel.Warn, tag, message, args),
      error: (message, ...args) => this.#write(LogLevel.Error, tag, message, args)
    };
  }

  /**
   * Register a sink to forward raw log entries to an external service.
   *
   * @param sink Sink function, or null to disable
   */
  setSink(sink: LogSink | null): void {
    this.#sink = sink;
  }

  /**
   * Flatten an entry's tag and arguments into structured attributes, serializing each
   * argument to a primitive and clamping its size.
   *
   * @param entry Entry handed to a log sink
   */
  getAttributes(entry: LogEntry): LogAttributes {
    const attributes: LogAttributes = { logger_tag: entry.tag };
    entry.args.forEach((arg, i) => {
      attributes[`arg${i}`] = this.#toAttributeValue(arg);
    });
    return attributes;
  }

  #write(level: LogLevel, tag: string, message: string, args: unknown[]): void {
    if (!this.#shouldLog(level)) {
      return;
    }

    const entry: LogEntry = { level, tag, message, args, timestampMs: Date.now() };

    this.#sink?.(entry);
    ConsoleLoggingService.write(entry);
  }

  #shouldLog(level: LogLevel): boolean {
    return this.#levelToNumber(level) >= this.#levelToNumber(this.#minLevel);
  }

  get #minLevel(): LogLevel {
    // Requirement: only pay attention to the CI flag Vitest uses for now.
    // In Vitest, `process.env.VITEST` is set.
    const isVitest =
      Boolean(this.#getEnvVar('VITEST')) || Boolean(this.#getEnvVar('STORYBOOK_VITEST'));
    return isVitest ? LogLevel.Warn : LogLevel.Debug;
  }

  #getEnvVar(name: string): string | undefined {
    if (typeof process === 'undefined') return undefined;
    return process.env[name];
  }

  #levelToNumber(level: LogLevel): number {
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
  }

  #toAttributeValue(arg: unknown): string | number | boolean {
    if (typeof arg === 'number' || typeof arg === 'boolean') {
      return arg;
    }
    if (typeof arg === 'string') {
      return this.#truncate(arg);
    }
    if (arg instanceof Error) {
      return this.#truncate(arg.message);
    }
    try {
      // Returns undefined for values JSON has no representation for, such as functions.
      return this.#truncate(JSON.stringify(arg) ?? String(arg));
    } catch {
      // JSON.stringify throws on cyclic references and on BigInt.
      return '[unserializable]';
    }
  }

  #truncate(value: string): string {
    const max = LoggingService.#maxAttributeLength;
    return value.length > max ? `${value.slice(0, max)}...` : value;
  }
}

const loggingService = new LoggingService();
export default loggingService;
