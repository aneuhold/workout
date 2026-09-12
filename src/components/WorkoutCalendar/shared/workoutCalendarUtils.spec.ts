import { describe, expect, it } from 'vitest';
import workoutCalendarUtils from './workoutCalendarUtils';

describe('workoutCalendarUtils', () => {
  describe('isNewMonth', () => {
    it('returns true when prevDate is null', () => {
      expect(workoutCalendarUtils.isNewMonth(new Date(2026, 1, 1), null)).toBe(true);
    });

    it('returns true when the month changes', () => {
      expect(workoutCalendarUtils.isNewMonth(new Date(2026, 2, 1), new Date(2026, 1, 28))).toBe(
        true
      );
    });

    it('returns true when the year changes', () => {
      expect(workoutCalendarUtils.isNewMonth(new Date(2027, 0, 1), new Date(2026, 11, 31))).toBe(
        true
      );
    });

    it('returns false within the same month', () => {
      expect(workoutCalendarUtils.isNewMonth(new Date(2026, 1, 15), new Date(2026, 1, 14))).toBe(
        false
      );
    });
  });

  describe('formatMonthLabel', () => {
    it('formats a date as short month + year', () => {
      expect(workoutCalendarUtils.formatMonthLabel(new Date(2026, 1, 1))).toBe('Feb 2026');
    });
  });
});
