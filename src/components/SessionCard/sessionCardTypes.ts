/**
 * Status of a session on the sessions page.
 */
export enum SessionStatus {
  /** complete === true, all late fields filled */
  Completed = 'completed',
  /** complete === true, has null late fields on non-deload exercises */
  Review = 'review',
  /** complete === false, at least one set with actualReps != null */
  InProgress = 'inProgress',
  /** First incomplete session with no logged sets in the current microcycle while no session is in progress, or an in-progress free-form session with no logged sets */
  NextUp = 'nextUp',
  /** Remaining incomplete sessions (including planned free-form sessions and a session that is upcoming) */
  Upcoming = 'upcoming'
}
