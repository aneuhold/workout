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

  describe('date formats', () => {
    const date = new Date(2026, 2, 29);

    it('formatDate uses the short month, day, and year', () => {
      expect(stringFormatService.formatDate(date)).toBe('Mar 29, 2026');
    });

    it('formatMonthDay omits the year', () => {
      expect(stringFormatService.formatMonthDay(date)).toBe('Mar 29');
    });

    it('formatFullDate includes the weekday and full month', () => {
      expect(stringFormatService.formatFullDate(date)).toBe('Sunday, March 29, 2026');
    });

    it('formatMonthYear uses the short month and year', () => {
      expect(stringFormatService.formatMonthYear(date)).toBe('Mar 2026');
    });

    it('formatDateRange joins two month-day dates with an en dash', () => {
      expect(stringFormatService.formatDateRange(date, new Date(2026, 3, 5))).toBe(
        'Mar 29 – Apr 5'
      );
    });
  });
});
