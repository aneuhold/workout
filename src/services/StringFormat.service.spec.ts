import { describe, expect, it } from 'vitest';
import stringFormatService from './StringFormat.service';

describe('StringFormatService', () => {
  describe('pluralize', () => {
    it('uses the singular form for a count of 1', () => {
      expect(stringFormatService.pluralize(1, 'set')).toBe('1 set');
    });

    it('appends "s" for counts other than 1', () => {
      expect(stringFormatService.pluralize(0, 'set')).toBe('0 sets');
      expect(stringFormatService.pluralize(2, 'set')).toBe('2 sets');
    });

    it('uses the given plural form', () => {
      expect(stringFormatService.pluralize(1, 'exercise needs', 'exercises need')).toBe(
        '1 exercise needs'
      );
      expect(stringFormatService.pluralize(3, 'exercise needs', 'exercises need')).toBe(
        '3 exercises need'
      );
    });
  });

  describe('formatTime', () => {
    it('pads seconds to two digits', () => {
      expect(stringFormatService.formatTime(65)).toBe('1:05');
    });

    it('formats under a minute with a leading zero minute', () => {
      expect(stringFormatService.formatTime(9)).toBe('0:09');
    });
  });
});
