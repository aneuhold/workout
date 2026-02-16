/**
 * Status of a session on the sessions page.
 *
 * - `Completed` - complete === true, all late fields filled
 * - `Review` - complete === true, has null late fields on non-deload exercises
 * - `InProgress` - complete === false, at least one set with actualReps != null
 * - `NextUp` - first incomplete session with no logged sets
 * - `Upcoming` - remaining incomplete sessions
 */
export enum SessionStatus {
  Completed = 'completed',
  Review = 'review',
  InProgress = 'inProgress',
  NextUp = 'nextUp',
  Upcoming = 'upcoming'
}
