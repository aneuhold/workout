import { type LogEntry, LogLevel } from '$services/LoggingService/types';

/**
 * Per-tag console styling. Node terminals take ANSI escape codes, browser consoles take
 * CSS applied through `%c` substitutions.
 */
type ConsoleFormat =
  | { kind: 'node-ansi'; prefix: string; suffix: string }
  | { kind: 'browser-css'; label: string; labelStyle: string; resetStyle: string };

/**
 * Writes log entries to the console, prefixed with a tag colored deterministically so that
 * entries from the same source are recognizable at a glance.
 */
class ConsoleLoggingService {
  /**
   * A palette of 256-color ANSI foreground codes (similar in spirit to debug's colors).
   */
  static readonly #palette: number[] = [
    20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62, 63, 68, 69, 74, 75, 76, 77,
    78, 79, 80, 81, 92, 93, 98, 99, 112, 113, 128, 129, 134, 135, 148, 149, 160, 161, 162, 163, 164,
    165, 166, 167, 168, 169, 170, 171, 172, 173, 178, 179, 184, 185, 196, 197, 198, 199, 200, 201,
    202, 203, 204, 205, 206, 207, 208, 209, 214, 215, 220, 221
  ];

  /**
   * @param entry Entry to render
   */
  write(entry: LogEntry): void {
    const { level, tag, message, args } = entry;
    const format = this.#getFormatForTag(tag);

    if (format.kind === 'node-ansi') {
      this.#writeToConsole(level, `[${format.prefix}${tag}${format.suffix}]`, message, args);
      return;
    }

    // Browser consoles can render CSS styles via %c.
    const prefix = `%c[${format.label}]%c`;
    this.#writeToConsole(level, prefix, message, args, format.labelStyle, format.resetStyle);
  }

  #getFormatForTag(tag: string): ConsoleFormat {
    const colorCode = this.#pickDeterministicColorCode(tag);

    if (this.#isNodeRuntime) {
      return {
        kind: 'node-ansi',
        prefix: `\u001b[38;5;${colorCode}m`,
        suffix: '\u001b[0m'
      };
    }

    const hue = (colorCode * 37) % 360;
    return {
      kind: 'browser-css',
      label: tag,
      labelStyle: `color: hsl(${hue} 70% 45%); font-weight: 600;`,
      resetStyle: 'color: inherit; font-weight: inherit;'
    };
  }

  get #isNodeRuntime(): boolean {
    if (typeof process === 'undefined') return false;
    return Boolean(process.versions.node);
  }

  #pickDeterministicColorCode(tag: string): number {
    const { length } = ConsoleLoggingService.#palette;
    return ConsoleLoggingService.#palette[this.#hashString(tag) % length] ?? 33;
  }

  #hashString(value: string): number {
    // djb2
    let hash = 5381;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 33) ^ value.charCodeAt(i);
    }

    return Math.abs(hash);
  }

  #writeToConsole(
    level: LogLevel,
    tagPrefix: string,
    message: string,
    args: unknown[],
    ...styleArgs: string[]
  ): void {
    const fullMessage = `${tagPrefix} ${message}`;

    switch (level) {
      case LogLevel.Debug:
        console.log(fullMessage, ...styleArgs, ...args);
        return;
      case LogLevel.Info:
        console.info(fullMessage, ...styleArgs, ...args);
        return;
      case LogLevel.Warn:
        console.warn(fullMessage, ...styleArgs, ...args);
        return;
      case LogLevel.Error:
        console.error(fullMessage, ...styleArgs, ...args);
        return;
    }
  }
}

const consoleLoggingService = new ConsoleLoggingService();
export default consoleLoggingService;
