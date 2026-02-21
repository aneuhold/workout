/**
 * The current mode of the session page, derived from session state.
 *
 * - `Active`: Session is in progress (complete === false)
 * - `Review`: Session is complete but some late fields are still null
 * - `View`: Session is complete and all fields are filled
 * - `Locked`: Session cannot be interacted with (prerequisite not met)
 */
export enum SessionPageMode {
  Active = 'active',
  Review = 'review',
  View = 'view',
  Locked = 'locked'
}

/**
 * Visual state of an exercise card within the session.
 */
export enum SessionPageExerciseCardState {
  Completed = 'completed',
  Current = 'current',
  Future = 'future'
}

/**
 * Visual state of a single set row.
 */
export enum SessionPageSetState {
  Completed = 'completed',
  Current = 'current',
  Future = 'future'
}

/**
 * Color mode for slider fields, determining the color gradient direction.
 *
 * - `Positive`: Green gradient (higher = better), used for RSM sliders
 * - `Negative`: Red gradient (higher = worse), used for fatigue sliders
 * - `Performance`: Neutral for scores 0-2, red only for score 3
 */
export enum SessionPageSliderColorMode {
  Positive = 'positive',
  Negative = 'negative',
  Performance = 'performance'
}
