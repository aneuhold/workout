import type { ProjectWorkoutPrimaryEndpointOptions } from '@aneuhold/core-ts-api-lib';
import type {
  CalibrationExercisePair,
  WorkoutExercise,
  WorkoutExerciseCalibration,
  WorkoutMesocycle,
  WorkoutMicrocycle
} from '@aneuhold/core-ts-db-lib';
import { WorkoutMesocycleSchema, WorkoutMesocycleService } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import mesocycleMapService, {
  type MesocycleChildDocs,
  type MesocycleDataSources
} from '$services/documentMapServices/mesocycleMapService.svelte';
import microcycleMapService from '$services/documentMapServices/microcycleMapService.svelte';
import sessionExerciseMapService from '$services/documentMapServices/sessionExerciseMapService.svelte';
import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';
import setMapService from '$services/documentMapServices/setMapService.svelte';
import WorkoutAPIService from '$util/api/WorkoutAPIService';

export enum MesocyclePageMode {
  New = 'new',
  Edit = 'edit',
  Static = 'static'
}

/**
 * Groups calibrations by exercise (keeping only the latest per exercise),
 * pairs each with its exercise, and returns the list sorted by exercise name.
 *
 * @param calibrations Calibrations to consider (pre-filter if needed)
 * @param exercises All available exercises
 */
export function buildCalibratedExercisePairs(
  calibrations: WorkoutExerciseCalibration[],
  exercises: WorkoutExercise[]
): CalibrationExercisePair[] {
  const exerciseMap = new Map(exercises.map((exercise) => [exercise._id, exercise]));

  const latestByExercise = new Map<UUID, WorkoutExerciseCalibration>();
  for (const calibration of calibrations) {
    const existing = latestByExercise.get(calibration.workoutExerciseId);
    if (!existing || new Date(calibration.dateRecorded) > new Date(existing.dateRecorded)) {
      latestByExercise.set(calibration.workoutExerciseId, calibration);
    }
  }

  const pairs: CalibrationExercisePair[] = [];
  for (const [exerciseId, calibration] of latestByExercise) {
    const exercise = exerciseMap.get(exerciseId);
    if (exercise) {
      pairs.push({ calibration, exercise });
    }
  }
  return pairs.sort((a, b) => a.exercise.exerciseName.localeCompare(b.exercise.exerciseName));
}

/**
 * Filters calibrations and exercises to only those relevant to the given
 * calibration IDs. Returns both the matching calibrations and their exercises.
 *
 * @param calibrationIds IDs of selected calibrations
 * @param allCalibrations Full list of calibrations
 * @param allExercises Full list of exercises
 */
export function getDocsForCalibrationIds(
  calibrationIds: UUID[],
  allCalibrations: WorkoutExerciseCalibration[],
  allExercises: WorkoutExercise[]
): { calibrations: WorkoutExerciseCalibration[]; exercises: WorkoutExercise[] } {
  const calibrations = allCalibrations.filter((c) => calibrationIds.includes(c._id));
  const exerciseIds = new Set(calibrations.map((c) => c.workoutExerciseId));
  const exercises = allExercises.filter((e) => exerciseIds.has(e._id));
  return { calibrations, exercises };
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
 * @param calibrationIds Selected calibration IDs
 * @param dataSources Reference data from map services
 * @param startDate Desired start date for the first microcycle
 */
export function generateMesocycleChildren(
  mesocycle: WorkoutMesocycle,
  calibrationIds: UUID[],
  dataSources: MesocycleDataSources,
  startDate: Date
): MesocycleChildDocs | null {
  const { calibrations, exercises } = getDocsForCalibrationIds(
    calibrationIds,
    dataSources.calibrations,
    dataSources.exercises
  );
  try {
    const result = WorkoutMesocycleService.generateOrUpdateMesocycle(
      mesocycle,
      calibrations,
      exercises,
      dataSources.equipmentTypes,
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
      sets: result.sets?.create ?? [],
      exercises
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
 * @param dataSources Reference data from map services
 * @param startDate Desired start date for the first microcycle
 */
export function persistNewMesocycle(
  mesocycleInput: Record<string, unknown>,
  dataSources: MesocycleDataSources,
  startDate: Date
): void {
  const mesocycleDoc = WorkoutMesocycleSchema.parse(mesocycleInput);

  const children = generateMesocycleChildren(
    mesocycleDoc,
    mesocycleDoc.calibratedExercises,
    dataSources,
    startDate
  );
  if (!children) return;

  const apiOptions = mesocycleMapService.prepareDocsForSave({ insert: [mesocycleDoc] });
  batchChildDocs(children, apiOptions);
  WorkoutAPIService.queryApi(apiOptions);
}

/**
 * Updates an existing mesocycle's configuration and regenerates all child
 * documents, replacing existing ones via a single batched API call.
 *
 * @param mesocycle The existing mesocycle document (will be mutated in place)
 * @param updates Partial mesocycle fields to apply via Object.assign
 * @param dataSources Reference data from map services
 * @param startDate Desired start date for the first microcycle
 */
export function persistMesocycleEdits(
  mesocycle: WorkoutMesocycle,
  updates: Partial<WorkoutMesocycle>,
  dataSources: MesocycleDataSources,
  startDate: Date
): void {
  const existingDocs = mesocycleMapService.getAssociatedDocsForMesocycle(mesocycle._id);
  Object.assign(mesocycle, updates);

  const children = generateMesocycleChildren(
    mesocycle,
    mesocycle.calibratedExercises,
    dataSources,
    startDate
  );
  if (!children) return;

  const apiOptions = mesocycleMapService.prepareDocsForSave({ update: [mesocycle] });
  batchChildDocs(children, apiOptions, existingDocs);
  WorkoutAPIService.queryApi(apiOptions);
}

/**
 * Batches child document insert (and optionally delete) operations into
 * the given API options object, updating local state in the process.
 *
 * @param children Generated child documents to insert
 * @param apiOptions The API options object to accumulate operations into
 * @param oldChildren Optional existing child documents whose IDs will be deleted
 */
function batchChildDocs(
  children: MesocycleChildDocs,
  apiOptions: ProjectWorkoutPrimaryEndpointOptions,
  oldChildren?: MesocycleChildDocs
): void {
  microcycleMapService.prepareDocsForSave(
    { delete: oldChildren?.microcycles.map((d) => d._id), insert: children.microcycles },
    apiOptions
  );
  sessionMapService.prepareDocsForSave(
    { delete: oldChildren?.sessions.map((d) => d._id), insert: children.sessions },
    apiOptions
  );
  sessionExerciseMapService.prepareDocsForSave(
    { delete: oldChildren?.sessionExercises.map((d) => d._id), insert: children.sessionExercises },
    apiOptions
  );
  setMapService.prepareDocsForSave(
    { delete: oldChildren?.sets.map((d) => d._id), insert: children.sets },
    apiOptions
  );
}
