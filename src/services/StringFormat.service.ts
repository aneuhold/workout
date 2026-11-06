/**
 * Formats values into user-facing strings. Dates use one set of `en-US`
 * formats so the same kind of date reads the same everywhere.
 */
class StringFormatService {
  #dateFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  #monthDayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  #fullDateFormat = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  #monthYearFormat = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

  /**
   * Formats a count with its noun, picking the singular form only when the
   * count is exactly 1 (e.g. `pluralize(1, 'set')` is "1 set",
   * `pluralize(0, 'set')` is "0 sets").
   *
   * @param count The number to show and to pick the form by.
   * @param singular The singular form, used when `count` is 1.
   * @param plural The plural form. Defaults to `singular` with an "s" appended.
   */
  pluralize(count: number, singular: string, plural = `${singular}s`): string {
    return `${count} ${count === 1 ? singular : plural}`;
  }

  /**
   * Formats a number of seconds into a `m:ss` string.
   *
   * @param seconds The total number of seconds to format.
   */
  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  /**
   * Formats a date as the standard app date (e.g. "Oct 22, 2026").
   *
   * @param date The date to format.
   */
  formatDate(date: Date): string {
    return this.#dateFormat.format(date);
  }

  /**
   * Formats a date without the year (e.g. "Oct 22"), for dates whose year is
   * clear from context.
   *
   * @param date The date to format.
   */
  formatMonthDay(date: Date): string {
    return this.#monthDayFormat.format(date);
  }

  /**
   * Formats a date with the weekday and full month (e.g. "Monday, March 29, 2026").
   *
   * @param date The date to format.
   */
  formatFullDate(date: Date): string {
    return this.#fullDateFormat.format(date);
  }

  /**
   * Formats a date as a month and year (e.g. "Feb 2026").
   *
   * @param date The date to format.
   */
  formatMonthYear(date: Date): string {
    return this.#monthYearFormat.format(date);
  }

  /**
   * Formats two dates as a range without years (e.g. "Oct 22 – Oct 29").
   *
   * @param start The first day of the range.
   * @param end The end of the range.
   */
  formatDateRange(start: Date, end: Date): string {
    return `${this.formatMonthDay(start)} – ${this.formatMonthDay(end)}`;
  }
}

const stringFormatService = new StringFormatService();
export default stringFormatService;
