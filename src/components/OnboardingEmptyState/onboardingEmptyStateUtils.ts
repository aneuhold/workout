import type { WorkoutMesocycle, WorkoutSet } from '@aneuhold/core-ts-db-lib';
import { WorkoutSetService } from '@aneuhold/core-ts-db-lib';

/**
 * The first-run onboarding checklist stays visible only while the user has no
 * mesocycle and no completed sets. Either condition closes it permanently.
 *
 * @param mesocycles All mesocycles for the user.
 * @param sets All sets for the user.
 */
export function shouldShowOnboardingChecklist(
  mesocycles: WorkoutMesocycle[],
  sets: WorkoutSet[]
): boolean {
  if (mesocycles.length > 0) return false;
  return !sets.some((s) => WorkoutSetService.isCompleted(s));
}
