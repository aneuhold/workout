import type { WorkoutExerciseCTO } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import { SvelteSet } from 'svelte/reactivity';
import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';

/**
 * Returns the CTOs for exercises referenced by the given calibration IDs.
 * Looks up each calibration to find its exercise ID, then retrieves the
 * CTO by exercise ID. O(k) where k = calibrationIds.length.
 *
 * @param calibrationIds Calibration IDs to resolve to CTOs
 */
export function getCTOsForCalibrationIds(calibrationIds: UUID[]): WorkoutExerciseCTO[] {
  const ctos: WorkoutExerciseCTO[] = [];
  const seen = new SvelteSet<UUID>();
  for (const calId of calibrationIds) {
    const cal = exerciseCalibrationMapService.getDoc(calId);
    if (!cal) continue;
    const exerciseId = cal.workoutExerciseId;
    if (seen.has(exerciseId)) continue;
    seen.add(exerciseId);
    const cto = exerciseMapService.getCTO(exerciseId);
    if (cto) ctos.push(cto);
  }
  return ctos;
}
