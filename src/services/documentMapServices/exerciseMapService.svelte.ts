import type { ProjectWorkoutPrimaryEndpointOptions } from '@aneuhold/core-ts-api-lib';
import type {
  DocumentMap,
  WorkoutEquipmentType,
  WorkoutExercise,
  WorkoutExerciseCalibration,
  WorkoutExerciseCTO,
  WorkoutSessionExercise,
  WorkoutSet
} from '@aneuhold/core-ts-db-lib';
import {
  WorkoutExerciseCalibrationService,
  WorkoutExerciseCTOSchema,
  WorkoutSessionExerciseService
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import { SvelteMap } from 'svelte/reactivity';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import LocalData from '$util/LocalData/LocalData';
import {
  createWorkoutPersistToDb,
  createWorkoutPrepareForSave,
  ctoGet
} from '$util/workoutPersistenceUtils';
import equipmentTypeMapService from './equipmentTypeMapService.svelte';

class ExerciseDocumentMapService extends DocumentMapStoreService<WorkoutExercise> {
  /** Keyed by exercise ID (same as the CTO's `_id`). */
  private exerciseCTOMapState: DocumentMap<WorkoutExerciseCTO> = $state({});

  /** All exercise CTOs fetched from the backend. */
  readonly exerciseCTOs: WorkoutExerciseCTO[] = $derived(
    Object.values(this.exerciseCTOMapState).filter(
      (cto): cto is WorkoutExerciseCTO => cto !== undefined
    )
  );

  constructor() {
    super({
      persistToLocalData: (map) =>
        LocalData.setAndGetDocumentMap(LocalData.storedKeyNames.exerciseMap, map),
      loadFromLocalData: () =>
        LocalData.getDocumentMap<WorkoutExercise>(LocalData.storedKeyNames.exerciseMap),
      persistToDb: createWorkoutPersistToDb('exercises'),
      prepareForSave: createWorkoutPrepareForSave('exercises')
    });
  }

  /**
   * Returns a single CTO by exercise ID, or undefined if not found.
   *
   * @param exerciseId The exercise ID to look up
   */
  getCTO(exerciseId: UUID): WorkoutExerciseCTO | undefined {
    return this.exerciseCTOMapState[exerciseId];
  }

  /**
   * Replaces all stored CTOs with the given array.
   *
   * @param ctos The new exercise CTOs from the backend
   */
  setExerciseCTOs(ctos: WorkoutExerciseCTO[]): void {
    const map: DocumentMap<WorkoutExerciseCTO> = {};
    for (const cto of ctos) {
      map[cto._id] = cto;
    }
    this.exerciseCTOMapState = map;
  }

  /**
   * Persists a newly created exercise and seeds a matching CTO in local
   * state so downstream features (best set tracking, auto-calibration
   * generation, last-session lookups) find a CTO for the exercise without
   * waiting for the server round-trip. No-op if the exercise's equipment
   * type can't be resolved.
   *
   * @param exercise The new exercise to persist
   */
  createNewExercise(exercise: WorkoutExercise): void {
    const equipmentType = equipmentTypeMapService.getDoc(exercise.workoutEquipmentTypeId);
    if (!equipmentType) return;

    this.addDoc(exercise, ctoGet);

    this.exerciseCTOMapState[exercise._id] = this.buildMinimalCTO(exercise, equipmentType, null);
  }

  /**
   * Updates the CTO's bestCalibration for the given calibration's exercise.
   * Creates a minimal CTO if none exists. Replaces the existing bestCalibration
   * only if the new one has a higher 1RM.
   *
   * @param calibration The calibration to evaluate
   */
  updateCTOBestCalibration(calibration: WorkoutExerciseCalibration): void {
    const exerciseId = calibration.workoutExerciseId;
    const cto = this.exerciseCTOMapState[exerciseId];
    const new1RM = WorkoutExerciseCalibrationService.get1RM(calibration);

    if (!cto) {
      const exercise = this.getDoc(exerciseId);
      if (!exercise) return;
      const equipmentType = equipmentTypeMapService.getDoc(exercise.workoutEquipmentTypeId);
      if (!equipmentType) return;
      this.exerciseCTOMapState[exerciseId] = this.buildMinimalCTO(
        exercise,
        equipmentType,
        calibration
      );
      return;
    }

    if (!cto.bestCalibration) {
      cto.bestCalibration = calibration;
      return;
    }

    const existing1RM = WorkoutExerciseCalibrationService.get1RM(cto.bestCalibration);
    if (new1RM > existing1RM) {
      cto.bestCalibration = calibration;
    }
  }

  /**
   * Updates the CTO's bestSet for the given set's exercise if the set has a
   * higher 1RM than the current bestSet. Skips if the set has no actual data
   * or no CTO exists.
   *
   * @param set The set to evaluate
   */
  updateCTOBestSet(set: WorkoutSet): void {
    if (set.actualWeight == null || !set.actualReps || set.actualReps <= 0) return;
    const cto = this.exerciseCTOMapState[set.workoutExerciseId];
    if (!cto) return;

    const new1RM = WorkoutExerciseCalibrationService.get1RMRaw(set.actualWeight, set.actualReps);

    if (!cto.bestSet || cto.bestSet.actualWeight == null || !cto.bestSet.actualReps) {
      cto.bestSet = set;
      return;
    }

    const existing1RM = WorkoutExerciseCalibrationService.get1RMRaw(
      cto.bestSet.actualWeight,
      cto.bestSet.actualReps
    );
    if (new1RM > existing1RM) {
      cto.bestSet = set;
    }
  }

  /**
   * Updates CTOs for exercises involved in a completed session. For each
   * exercise, updates lastSession* (any cycle type), lastAccumulationSession*
   * (non-deload only), and checks sets against bestSet. Caller passes data to
   * avoid circular imports.
   *
   * @param sessionExercises The session exercises from the completed session
   * @param sessionSets The sets from the completed session
   */
  updateCTOsForCompletedSession(
    sessionExercises: WorkoutSessionExercise[],
    sessionSets: WorkoutSet[]
  ): void {
    const setsBySessionExerciseId = new SvelteMap<UUID, WorkoutSet[]>();
    for (const set of sessionSets) {
      const seId = set.workoutSessionExerciseId;
      const existing = setsBySessionExerciseId.get(seId);
      if (existing) {
        existing.push(set);
      } else {
        setsBySessionExerciseId.set(seId, [set]);
      }
    }

    for (const se of sessionExercises) {
      const exerciseId = se.workoutExerciseId;
      const cto = this.exerciseCTOMapState[exerciseId];
      if (!cto) continue;

      const seSets = setsBySessionExerciseId.get(se._id);
      const orderedSets = se.setOrder
        .map((setId) => seSets?.find((s) => s._id === setId))
        .filter((s): s is WorkoutSet => s != null);

      // Always update lastSession* if the new session exercise is more recent.
      // This tracks the literal latest performance regardless of cycle type.
      if (!cto.lastSessionExercise || se.createdDate > cto.lastSessionExercise.createdDate) {
        cto.lastSessionExercise = se;
        cto.lastSessionSets = orderedSets;
      }

      // Only update lastAccumulationSession* for non-deload exercises, since
      // deload weights/reps are not meaningful progression baselines.
      if (!WorkoutSessionExerciseService.isDeloadExercise(seSets ?? [])) {
        if (
          !cto.lastAccumulationSessionExercise ||
          se.createdDate > cto.lastAccumulationSessionExercise.createdDate
        ) {
          cto.lastAccumulationSessionExercise = se;
          cto.lastAccumulationSessionSets = orderedSets;
        }
      }

      // Check sets against bestSet
      if (seSets) {
        for (const set of seSets) {
          this.updateCTOBestSet(set);
        }
      }
    }
  }

  /**
   * Removes the CTO for a given exercise ID.
   *
   * @param exerciseId The exercise ID whose CTO should be removed
   */
  removeCTO(exerciseId: UUID): void {
    delete this.exerciseCTOMapState[exerciseId];
  }

  override deleteDoc(docId: UUID, get?: ProjectWorkoutPrimaryEndpointOptions['get']): void {
    super.deleteDoc(docId, get ?? ctoGet);
    this.removeCTO(docId);
  }

  /**
   * Produces a fresh CTO with only the fields available locally populated.
   * Session/calibration history is empty; the next server fetch fills in the
   * rest.
   *
   * @param exercise The exercise the CTO wraps
   * @param equipmentType The exercise's resolved equipment type
   * @param bestCalibration Seed value for `bestCalibration` (null when unknown)
   */
  private buildMinimalCTO(
    exercise: WorkoutExercise,
    equipmentType: WorkoutEquipmentType,
    bestCalibration: WorkoutExerciseCalibration | null
  ): WorkoutExerciseCTO {
    return WorkoutExerciseCTOSchema.parse({
      ...exercise,
      equipmentType,
      bestCalibration,
      bestSet: null,
      lastSessionExercise: null,
      lastSessionSets: [],
      lastAccumulationSessionExercise: null,
      lastAccumulationSessionSets: []
    });
  }
}

export default new ExerciseDocumentMapService();
