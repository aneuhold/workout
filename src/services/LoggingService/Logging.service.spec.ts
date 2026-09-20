import { afterEach, describe, expect, it, vi } from 'vitest';
import LoggingService from './Logging.service';
import { type LogEntry, LogLevel } from './types';

/**
 * Collect the entries a logger produces through the sink.
 *
 * @param write Callback that emits the log lines under test
 */
const captureEntries = (write: () => void): LogEntry[] => {
  const entries: LogEntry[] = [];
  LoggingService.setSink((entry) => entries.push(entry));
  write();
  return entries;
};

afterEach(() => {
  LoggingService.setSink(null);
  vi.restoreAllMocks();
});

describe('LoggingService', () => {
  describe('createLogger', () => {
    it('tags entries and forwards the level, message, and args', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const log = LoggingService.createLogger('WorkoutAPIService.ts');

      const [entry] = captureEntries(() => log.error('Request failed', 500));

      expect(entry).toMatchObject({
        level: LogLevel.Error,
        tag: 'WorkoutAPIService.ts',
        message: 'Request failed',
        args: [500]
      });
    });

    it('drops entries below the minimum level, which is warn under Vitest', () => {
      const log = LoggingService.createLogger('WorkoutAPIService.ts');

      const entries = captureEntries(() => {
        log.debug('Not forwarded');
        log.info('Not forwarded');
      });

      expect(entries).toEqual([]);
    });
  });

  describe('setSink', () => {
    it('keeps a throwing sink from reaching the caller, and still writes the console line', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const log = LoggingService.createLogger('WorkoutAPIService.ts');
      LoggingService.setSink(() => {
        throw new Error('Sink is down');
      });

      expect(() => log.error('Request failed')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledOnce();
    });

    it('stops forwarding once cleared', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const log = LoggingService.createLogger('WorkoutAPIService.ts');
      const entries = captureEntries(() => log.warn('Forwarded'));

      LoggingService.setSink(null);
      log.warn('Not forwarded');

      expect(entries).toHaveLength(1);
    });
  });

  describe('getAttributes', () => {
    const buildEntry = (args: unknown[]): LogEntry => ({
      level: LogLevel.Info,
      tag: 'WorkoutAPIService.ts',
      message: 'Processing API request',
      args,
      timestampMs: Date.now()
    });

    it('carries the tag under logger_tag', () => {
      expect(LoggingService.getAttributes(buildEntry([]))).toEqual({
        logger_tag: 'WorkoutAPIService.ts'
      });
    });

    it('passes primitives through and indexes them by position', () => {
      expect(LoggingService.getAttributes(buildEntry(['a', 2, true]))).toMatchObject({
        arg0: 'a',
        arg1: 2,
        arg2: true
      });
    });

    it('reduces an Error to its message', () => {
      const { arg0 } = LoggingService.getAttributes(buildEntry([new Error('Request failed')]));
      expect(arg0).toBe('Request failed');
    });

    it('passes an array of one primitive type through untouched', () => {
      expect(LoggingService.getAttributes(buildEntry([['accessToken', 'userInfo']])).arg0).toEqual([
        'accessToken',
        'userInfo'
      ]);
      expect(LoggingService.getAttributes(buildEntry([[1, 2, 3]])).arg0).toEqual([1, 2, 3]);
      expect(LoggingService.getAttributes(buildEntry([[true, false]])).arg0).toEqual([true, false]);
    });

    it('serializes a mixed array, which backends cannot type', () => {
      const { arg0 } = LoggingService.getAttributes(buildEntry([['a', 1]]));
      expect(arg0).toBe('["a",1]');
    });

    it('serializes an array that busts the size budget', () => {
      const { arg0 } = LoggingService.getAttributes(buildEntry([['x'.repeat(2001)]]));
      expect(typeof arg0).toBe('string');
      expect(String(arg0)).toHaveLength(2003);
    });

    it('serializes objects to JSON', () => {
      const { arg0 } = LoggingService.getAttributes(buildEntry([{ userId: 1, nested: true }]));
      expect(arg0).toBe('{"userId":1,"nested":true}');
    });

    it('marks values JSON refuses to serialize', () => {
      const cyclic: { self?: unknown } = {};
      cyclic.self = cyclic;

      expect(LoggingService.getAttributes(buildEntry([cyclic])).arg0).toBe('[unserializable]');
    });

    it('falls back to the string form for values JSON has no representation for', () => {
      expect(LoggingService.getAttributes(buildEntry([undefined])).arg0).toBe('undefined');
      expect(LoggingService.getAttributes(buildEntry([() => 1])).arg0).toBe('() => 1');
    });

    it('clamps oversized values', () => {
      const { arg0 } = LoggingService.getAttributes(buildEntry(['x'.repeat(5000)]));
      expect(arg0).toBe(`${'x'.repeat(2000)}...`);
    });

    it('leaves values within the budget untouched', () => {
      const withinBudget = 'x'.repeat(2000);
      expect(LoggingService.getAttributes(buildEntry([withinBudget])).arg0).toBe(withinBudget);
    });
  });
});
