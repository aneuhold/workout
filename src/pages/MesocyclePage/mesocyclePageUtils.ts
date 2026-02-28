import type {
  WorkoutExerciseCTO,
  WorkoutMesocycle,
  WorkoutMicrocycle,
  WorkoutMuscleGroupVolumeCTO
} from '@aneuhold/core-ts-db-lib';
import { WorkoutMesocycleSchema, WorkoutMesocycleService } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
import mesocycleMapService, {
  type MesocycleChildDocs
} from '$services/documentMapServices/mesocycleMapService.svelte';
import microcycleMapService from '$services/documentMapServices/microcycleMapService.svelte';
import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
import WorkoutAPIService from '$util/api/WorkoutAPIService';

export enum MesocyclePageMode {
  New = 'new',
  Edit = 'edit',
  Static = 'static'
}

/**
 * Returns the start date of the earliest microcycle, or today if none exist.
 *
 * @param microcycles Microcycles to search through
 */
export function getEarliestStartDate(microcycles: WorkoutMicrocycle[]): Date {
  if (microcycles.length === 0) return new Date();
  const sorted = [...microcycles].sort((a, b) =>
    microcycleMapService.compareMicrocyclesByStartDate(a, b)
  );
  return new Date(sorted[0].startDate);
}

/**
 * Generates a fresh set of child documents (microcycles, sessions, etc.) for
 * a mesocycle using the core library. Passes empty arrays for existing docs so
 * the result is a complete fresh generation.
 *
 * @param mesocycle Parsed mesocycle document (may be a preview or persisted doc)
 * @param exerciseCTOs Pre-filtered exercise CTOs for this mesocycle's exercises
 * @param volumeCTOs Volume CTOs for the muscle groups trained in this mesocycle
 * @param startDate Desired start date for the first microcycle
 */
export function generateMesocycleChildren(
  mesocycle: WorkoutMesocycle,
  exerciseCTOs: WorkoutExerciseCTO[],
  volumeCTOs: WorkoutMuscleGroupVolumeCTO[],
  startDate: Date
): MesocycleChildDocs | null {
  try {
    const result = WorkoutMesocycleService.generateOrUpdateMesocycle(
      mesocycle,
      exerciseCTOs,
      volumeCTOs,
      [],
      [],
      [],
      [],
      startDate
    );
    return {
      microcycles: result.microcycles?.create ?? [],
      sessions: result.sessions?.create ?? [],
      sessionExercises: result.sessionExercises?.create ?? [],
      sets: result.sets?.create ?? []
    };
  } catch {
    return null;
  }
}

/**
 * Creates a new mesocycle document and persists it along with its generated
 * child documents in a single batched API call.
 *
 * @param mesocycleInput Raw object to parse via WorkoutMesocycleSchema (from
 *   `buildMesocycleInput` in the component, with title added)
 * @param startDate Desired start date for the first microcycle
 */
export function persistNewMesocycle(
  mesocycleInput: Record<string, unknown>,
  startDate: Date
): void {
  const mesocycleDoc = WorkoutMesocycleSchema.parse(mesocycleInput);
  const exerciseCTOs = exerciseMapService.getCTOsForCalibrationIds(
    mesocycleDoc.calibratedExercises
  );

  const children = generateMesocycleChildren(
    mesocycleDoc,
    exerciseCTOs,
    muscleGroupMapService.allVolumeCTOs,
    startDate
  );
  if (!children) return;

  const apiOptions = mesocycleMapService.prepareDocsForSave({ insert: [mesocycleDoc] });
  mesocycleMapService.batchChildDocSaves(apiOptions, { insert: children });
  WorkoutAPIService.queryApi(apiOptions);
}

/**
 * Updates an existing mesocycle's configuration and regenerates all child
 * documents, replacing existing ones via a single batched API call.
 *
 * @param mesocycle The existing mesocycle document (will be mutated in place)
 * @param updates Partial mesocycle fields to apply via Object.assign
 * @param startDate Desired start date for the first microcycle
 */
export function persistMesocycleEdits(
  mesocycle: WorkoutMesocycle,
  updates: Partial<WorkoutMesocycle>,
  startDate: Date
): void {
  const existingDocs = mesocycleMapService.getAssociatedDocsAndCTOsForMesocycle(mesocycle._id);
  Object.assign(mesocycle, updates);

  const exerciseCTOs = exerciseMapService.getCTOsForCalibrationIds(mesocycle.calibratedExercises);
  const children = generateMesocycleChildren(
    mesocycle,
    exerciseCTOs,
    existingDocs.volumeCTOs,
    startDate
  );
  if (!children) return;

  const apiOptions = mesocycleMapService.prepareDocsForSave({ update: [mesocycle] });
  mesocycleMapService.batchChildDocSaves(apiOptions, { insert: children, delete: existingDocs });
  WorkoutAPIService.queryApi(apiOptions);
}

/**
 * Calculates the default start date for a new mesocycle. Returns the later
 * of the projected end date of the last non-completed mesocycle and today.
 *
 * @param existingMesocycles All existing mesocycles
 * @param getMicrocycles Function that returns ordered microcycles for a mesocycle ID
 */
export function getDefaultNewMesocycleStartDate(
  existingMesocycles: WorkoutMesocycle[],
  getMicrocycles: (mesocycleId: UUID) => WorkoutMicrocycle[]
): Date {
  const mesocycleToMicrocyclesMap = new Map<UUID, WorkoutMicrocycle[]>();
  for (const m of existingMesocycles) {
    mesocycleToMicrocyclesMap.set(m._id, getMicrocycles(m._id));
  }
  return WorkoutMesocycleService.getEarliestAllowedStartDate(
    existingMesocycles,
    mesocycleToMicrocyclesMap
  );
}
