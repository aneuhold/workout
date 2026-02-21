/**
 * Returns a Date that is `n` days before now.
 *
 * @param n Number of days in the past
 */
export function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
