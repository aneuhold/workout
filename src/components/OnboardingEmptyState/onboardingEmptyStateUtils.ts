import type { WorkoutMesocycle, WorkoutSession } from '@aneuhold/core-ts-db-lib';

/**
 * The first-run onboarding checklist stays visible only while the user has no
 * mesocycles and no sessions. Either condition closes it permanently.
 *
 * @param mesocycles All mesocycles for the user.
 * @param sessions All sessions for the user.
 */
export function shouldShowOnboardingChecklist(
  mesocycles: WorkoutMesocycle[],
  sessions: WorkoutSession[]
): boolean {
  return mesocycles.length === 0 && sessions.length === 0;
}
