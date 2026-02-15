/**
 * Formats a number of seconds into a `m:ss` string.
 *
 * @param seconds The total number of seconds to format.
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
