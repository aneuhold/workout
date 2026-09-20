import { afterEach, describe, expect, it, vi } from 'vitest';
import ConsoleLoggingService from './ConsoleLogging.service';
import { type LogEntry, LogLevel } from './types';

const buildEntry = (level: LogLevel, tag = 'WorkoutAPIService.ts'): LogEntry => ({
  level,
  tag,
  message: 'Processing API request',
  args: [{ attempt: 1 }],
  timestampMs: Date.now()
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ConsoleLoggingService', () => {
  describe('write', () => {
    it.each([
      [LogLevel.Debug, 'log'],
      [LogLevel.Info, 'info'],
      [LogLevel.Warn, 'warn'],
      [LogLevel.Error, 'error']
    ] as const)('sends %s entries to console.%s', (level, method) => {
      const spy = vi.spyOn(console, method).mockImplementation(() => undefined);

      ConsoleLoggingService.write(buildEntry(level));

      expect(spy).toHaveBeenCalledOnce();
    });

    it('includes the tag and message, and passes the args through untouched', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const entry = buildEntry(LogLevel.Warn);

      ConsoleLoggingService.write(entry);

      const [message, ...rest] = spy.mock.calls[0] ?? [];
      expect(message).toContain('WorkoutAPIService.ts');
      expect(message).toContain('Processing API request');
      expect(rest.at(-1)).toBe(entry.args[0]);
    });

    it('colors a tag the same way every time', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      ConsoleLoggingService.write(buildEntry(LogLevel.Warn));
      ConsoleLoggingService.write(buildEntry(LogLevel.Warn));

      expect(spy.mock.calls[0]).toEqual(spy.mock.calls[1]);
    });

    it('colors different tags differently', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      ConsoleLoggingService.write(buildEntry(LogLevel.Warn, 'WorkoutAPIService.ts'));
      ConsoleLoggingService.write(buildEntry(LogLevel.Warn, 'loginState.ts'));

      expect(spy.mock.calls[0]).not.toEqual(spy.mock.calls[1]);
    });
  });
});
