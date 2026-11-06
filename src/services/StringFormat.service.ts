/**
 * Formats values into user-facing strings.
 */
class StringFormatService {
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
}

const stringFormatService = new StringFormatService();
export default stringFormatService;
