import type { ProjectWorkoutPrimaryEndpointOptions } from '@aneuhold/core-ts-api-lib';
import type {
  WorkoutEquipmentType,
  WorkoutExercise,
  WorkoutExerciseCalibration,
  WorkoutMesocycle,
  WorkoutMicrocycle,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet
} from '@aneuhold/core-ts-db-lib';
import { WorkoutMesocycleService, WorkoutSessionService } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import DocumentMapStoreService from '$services/DocumentMapStoreService.svelte';
import WorkoutAPIService from '$util/api/WorkoutAPIService';
import LocalData from '$util/LocalData/LocalData';
import createWorkoutPersistToDb from '$util/workoutPersistenceUtils';
import { createWorkoutPrepareForSave } from '$util/workoutPersistenceUtils';
import equipmentTypeMapService from './equipmentTypeMapService.svelte';
import exerciseCalibrationMapService from './exerciseCalibrationMapService.svelte';
import exerciseMapService from './exerciseMapService.svelte';
import microcycleMapService from './microcycleMapService.svelte';
import sessionExerciseMapService from './sessionExerciseMapService.svelte';
import sessionMapService from './sessionMapService.svelte';
import setMapService from './setMapService.svelte';

export type MesocycleDataSources = {
  calibrations: WorkoutExerciseCalibration[];
  exercises: WorkoutExercise[];
  equipmentTypes: WorkoutEquipmentType[];
};

export type MesocycleChildDocs = {
  microcycles: WorkoutMicrocycle[];
  sessions: WorkoutSession[];
  sessionExercises: WorkoutSessionExercise[];
  sets: WorkoutSet[];
  exercises: WorkoutExercise[];
};

export type MesocycleAssociatedDocs = MesocycleDataSources & MesocycleChildDocs;

class MesocycleDocumentMapService extends DocumentMapStoreService<WorkoutMesocycle> {
  constructor() {
    super({
      persistToLocalData: (map) => LocalData.setAndGetMesocycleMap(map),
      persistToDb: createWorkoutPersistToDb('mesocycles'),
      prepareForSave: createWorkoutPrepareForSave('mesocycles')
    });
  }

  /**
   * The derived in-progress and next-up sessions for the active mesocycle.
   */
  readonly activeAndNextSessions = $derived.by(() => {
    const activeMesocycle = this.getActiveMesocycle();
    if (!activeMesocycle) return { inProgressSession: null, nextUpSession: null } as const;
    const docs = this.getAssociatedDocsForMesocycle(activeMesocycle._id);
    return WorkoutSessionService.getActiveAndNextSessions(
      docs.sessions,
      sessionExerciseMapService.getMap(),
      setMapService.getMap()
    );
  });

  /**
   * Returns the first mesocycle without a `completedDate`, or null.
   * O(n) where n = total mesocycles.
   */
  getActiveMesocycle(): WorkoutMesocycle | null {
    return this.allDocs.find((m) => !m.completedDate) ?? null;
  }

  /**
   * Returns completed mesocycles sorted most-recent-first by `completedDate`.
   * O(n log n) where n = total mesocycles.
   */
  getPastMesocycles(): WorkoutMesocycle[] {
    return this.allDocs
      .filter(
        (m: WorkoutMesocycle): m is WorkoutMesocycle & { completedDate: Date } =>
          m.completedDate != null
      )
      .sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime());
  }

  /**
   * Returns the effective start date of a mesocycle. Uses the mesocycle's own
   * `startDate` if set, otherwise falls back to the first microcycle's `startDate`.
   * Accepts either a UUID (which triggers a map lookup) or a full document for
   * better performance when the caller already has it.
   *
   * @param mesocycleIdOrMesocycle The mesocycle ID or full document.
   * @param microcycles Optional pre-fetched ordered microcycles.
   */
  getMesocycleStartDate(
    mesocycleIdOrMesocycle: UUID | WorkoutMesocycle,
    microcycles?: WorkoutMicrocycle[]
  ): Date | null {
    const meso =
      typeof mesocycleIdOrMesocycle === 'string'
        ? this.getDoc(mesocycleIdOrMesocycle)
        : mesocycleIdOrMesocycle;
    if (meso?.startDate) return meso.startDate;
    const mesoId = typeof mesocycleIdOrMesocycle === 'string' ? mesocycleIdOrMesocycle : meso?._id;
    if (!mesoId) return null;
    const mcs = microcycles ?? microcycleMapService.getOrderedMicrocyclesForMesocycle(mesoId);
    return mcs.length > 0 ? mcs[0].startDate : null;
  }

  /**
   * Single entry point for all docs belonging to a mesocycle. Runs the O(n)
   * microcycle scan once, then traverses down via O(1) order-array lookups.
   * Microcycles are sorted by `startDate`; sessions, exercises, and sets
   * preserve their respective order-array sequences.
   * Overall: O(n log m + s + e + t) where n = total microcycles,
   * m = matched microcycles, s = sessions, e = exercises, t = sets.
   *
   * @param mesocycleId ID of the mesocycle to get associated docs for.
   */
  getAssociatedDocsForMesocycle(mesocycleId: UUID): MesocycleAssociatedDocs {
    const mesocycle = this.getDoc(mesocycleId);
    const microcycles = microcycleMapService.getOrderedMicrocyclesForMesocycle(mesocycleId);
    const sessions = microcycleMapService.getOrderedSessionsForMicrocycles(microcycles);
    const sessionExercises = sessionMapService.getOrderedSessionExercisesForSessions(sessions);
    const sets = sessionExercises.flatMap((sessionExercise) =>
      sessionExerciseMapService.getOrderedSetsForSessionExercise(sessionExercise)
    );
    const calibrations = exerciseCalibrationMapService.getDocsWithIds(
      mesocycle?.calibratedExercises ?? []
    );
    const exercises = exerciseMapService.getExercisesForCalibrations(calibrations);
    const equipmentTypes = equipmentTypeMapService.getEquipmentTypesForExercises(exercises);

    return {
      microcycles,
      sessions,
      sessionExercises,
      sets,
      calibrations,
      exercises,
      equipmentTypes
    };
  }

  /**
   * Batches child document saves (insert, update, and/or delete) for microcycles,
   * sessions, sessionExercises, and sets into the given API options.
   * Skips exercises as they are reference data, not children.
   *
   * @param apiOptions The API options object to accumulate operations into
   * @param options Child documents to insert, update, and/or delete
   * @param options.insert Child documents to insert into their respective stores
   * @param options.update Child documents to update in their respective stores
   * @param options.delete Child documents whose IDs will be removed from their respective stores
   */
  batchChildDocSaves(
    apiOptions: ProjectWorkoutPrimaryEndpointOptions,
    options: {
      insert?: MesocycleChildDocs;
      update?: Partial<MesocycleChildDocs>;
      delete?: MesocycleChildDocs;
    }
  ): void {
    microcycleMapService.prepareDocsForSave(
      {
        delete: options.delete?.microcycles.map((d) => d._id),
        insert: options.insert?.microcycles,
        update: options.update?.microcycles
      },
      apiOptions
    );
    sessionMapService.prepareDocsForSave(
      {
        delete: options.delete?.sessions.map((d) => d._id),
        insert: options.insert?.sessions,
        update: options.update?.sessions
      },
      apiOptions
    );
    sessionExerciseMapService.prepareDocsForSave(
      {
        delete: options.delete?.sessionExercises.map((d) => d._id),
        insert: options.insert?.sessionExercises,
        update: options.update?.sessionExercises
      },
      apiOptions
    );
    setMapService.prepareDocsForSave(
      {
        delete: options.delete?.sets.map((d) => d._id),
        insert: options.insert?.sets,
        update: options.update?.sets
      },
      apiOptions
    );
  }

  /**
   * Ends a mesocycle immediately, removing all incomplete sessions and their
   * children. Sets the mesocycle's completedDate to the current date.
   *
   * @param mesocycleId The ID of the mesocycle to end.
   */
  endMesocycle(mesocycleId: UUID): void {
    const mesocycle = this.getDoc(mesocycleId);
    if (!mesocycle) return;

    const docs = this.getAssociatedDocsForMesocycle(mesocycleId);

    // Single pass: partition sessions and build lookup structures
    const incompleteSessions: WorkoutSession[] = [];
    const incompleteSessionIds = new SvelteSet<UUID>();
    const sessionsByMicrocycle = new SvelteMap<UUID, WorkoutSession[]>();
    for (const session of docs.sessions) {
      if (!session.complete) {
        incompleteSessions.push(session);
        incompleteSessionIds.add(session._id);
      }
      if (session.workoutMicrocycleId) {
        const existing = sessionsByMicrocycle.get(session.workoutMicrocycleId);
        if (existing) {
          existing.push(session);
        } else {
          sessionsByMicrocycle.set(session.workoutMicrocycleId, [session]);
        }
      }
    }

    const incompleteSessionExercises =
      sessionMapService.getOrderedSessionExercisesForSessions(incompleteSessions);
    const incompleteSets = sessionMapService.getOrderedSetsForSessions(incompleteSessions);

    // A microcycle is deleted only if ALL its sessions are incomplete
    const microcyclesToDelete = docs.microcycles.filter((mc) => {
      const mcSessions = sessionsByMicrocycle.get(mc._id) ?? [];
      return mcSessions.length > 0 && mcSessions.every((s) => incompleteSessionIds.has(s._id));
    });

    // Mutate the mesocycle in the store directly, then send the full doc as an update
    mesocycle.completedDate = new Date();
    const apiOptions = this.prepareDocsForSave({ update: [mesocycle] });
    this.batchChildDocSaves(apiOptions, {
      delete: {
        microcycles: microcyclesToDelete,
        sessions: incompleteSessions,
        sessionExercises: incompleteSessionExercises,
        sets: incompleteSets,
        exercises: []
      }
    });

    WorkoutAPIService.queryApi(apiOptions);
  }

  /**
   * Initiates an early deload for a mesocycle. Removes incomplete sessions and
   * generates a deload microcycle using the remaining completed data.
   *
   * @param mesocycleId The ID of the mesocycle.
   * @param deloadStartDate When the deload should begin.
   */
  initiateEarlyDeload(mesocycleId: UUID, deloadStartDate: Date): void {
    const mesocycle = this.getDoc(mesocycleId);
    if (!mesocycle) return;

    const docs = this.getAssociatedDocsForMesocycle(mesocycleId);

    // Partition sessions in a single pass, building lookup structures inline
    const incompleteSessions: WorkoutSession[] = [];
    const remainingSessions: WorkoutSession[] = [];
    const remainingSessionIds = new SvelteSet<UUID>();
    const incompleteSessionIds = new SvelteSet<UUID>();
    const sessionsByMicrocycle = new SvelteMap<UUID, WorkoutSession[]>();
    for (const session of docs.sessions) {
      if (session.complete) {
        remainingSessions.push(session);
        remainingSessionIds.add(session._id);
      } else {
        incompleteSessions.push(session);
        incompleteSessionIds.add(session._id);
      }
      if (session.workoutMicrocycleId) {
        const existing = sessionsByMicrocycle.get(session.workoutMicrocycleId);
        if (existing) {
          existing.push(session);
        } else {
          sessionsByMicrocycle.set(session.workoutMicrocycleId, [session]);
        }
      }
    }

    const incompleteSessionExercises: WorkoutSessionExercise[] = [];
    const incompleteSessionExerciseIds = new SvelteSet<UUID>();
    const remainingSessionExercises: WorkoutSessionExercise[] = [];
    for (const se of docs.sessionExercises) {
      if (incompleteSessionIds.has(se.workoutSessionId)) {
        incompleteSessionExercises.push(se);
        incompleteSessionExerciseIds.add(se._id);
      } else {
        remainingSessionExercises.push(se);
      }
    }

    const incompleteSets: WorkoutSet[] = [];
    const remainingSets: WorkoutSet[] = [];
    for (const s of docs.sets) {
      (incompleteSessionExerciseIds.has(s.workoutSessionExerciseId)
        ? incompleteSets
        : remainingSets
      ).push(s);
    }

    // A microcycle is deleted only if ALL its sessions are incomplete.
    // Remaining microcycles that had incomplete sessions removed get their
    // sessionOrder pruned and completedDate set.
    const microcyclesToDelete: WorkoutMicrocycle[] = [];
    const remainingMicrocycles: WorkoutMicrocycle[] = [];
    for (const mc of docs.microcycles) {
      const mcSessions = sessionsByMicrocycle.get(mc._id) ?? [];
      const allIncomplete =
        mcSessions.length > 0 && mcSessions.every((s) => incompleteSessionIds.has(s._id));
      if (allIncomplete) {
        microcyclesToDelete.push(mc);
        continue;
      }
      const updatedOrder = mc.sessionOrder.filter((id) => remainingSessionIds.has(id));
      if (updatedOrder.length < mc.sessionOrder.length) {
        mc.sessionOrder = updatedOrder;
        if (!mc.completedDate) {
          mc.completedDate = new Date();
        }
      }
      remainingMicrocycles.push(mc);
    }

    // Generate deload with plannedMicrocycleCount = remaining + 1
    const deloadMesocycle: WorkoutMesocycle = {
      ...mesocycle,
      plannedMicrocycleCount: remainingMicrocycles.length + 1
    };

    const generateResult = WorkoutMesocycleService.generateOrUpdateMesocycle(
      deloadMesocycle,
      docs.calibrations,
      docs.exercises,
      docs.equipmentTypes,
      remainingMicrocycles,
      remainingSessions,
      remainingSessionExercises,
      remainingSets,
      deloadStartDate
    );

    // Batch delete (incomplete) + create (deload) + update modified microcycles
    const apiOptions = this.prepareDocsForSave({});
    this.batchChildDocSaves(apiOptions, {
      delete: {
        microcycles: microcyclesToDelete,
        sessions: incompleteSessions,
        sessionExercises: incompleteSessionExercises,
        sets: incompleteSets,
        exercises: []
      },
      insert: {
        microcycles: generateResult.microcycles?.create ?? [],
        sessions: generateResult.sessions?.create ?? [],
        sessionExercises: generateResult.sessionExercises?.create ?? [],
        sets: generateResult.sets?.create ?? [],
        exercises: []
      },
      update: { microcycles: remainingMicrocycles }
    });

    WorkoutAPIService.queryApi(apiOptions);
  }

  /**
   * Moves a mesocycle forward or backward in time by the specified number of days.
   * Optionally cascades the shift to subsequent mesocycles.
   *
   * @param mesocycleId The ID of the mesocycle to move.
   * @param daysDelta Number of days to shift (positive = forward, negative = backward).
   * @param cascadeToSubsequent Whether to also shift subsequent mesocycles.
   */
  moveMesocycle(mesocycleId: UUID, daysDelta: number, cascadeToSubsequent: boolean): void {
    const mesocycle = this.getDoc(mesocycleId);
    if (!mesocycle) return;

    const docs = this.getAssociatedDocsForMesocycle(mesocycleId);

    // Shift dates in place
    WorkoutMesocycleService.shiftMesocycleDates(
      mesocycle,
      docs.microcycles,
      docs.sessions,
      daysDelta
    );

    // Persist the shifted mesocycle and its children
    const apiOptions = this.prepareDocsForSave({ update: [mesocycle] });
    microcycleMapService.prepareDocsForSave({ update: docs.microcycles }, apiOptions);
    sessionMapService.prepareDocsForSave({ update: docs.sessions }, apiOptions);

    // Cascade to subsequent mesocycles if requested
    if (cascadeToSubsequent) {
      const movedStart = this.getMesocycleStartDate(mesocycle, docs.microcycles);

      const allMesocycles = this.allDocs;
      for (const m of allMesocycles) {
        if (m._id === mesocycleId || m.completedDate != null) continue;

        const subsequentDocs = this.getAssociatedDocsForMesocycle(m._id);
        const effectiveStart = this.getMesocycleStartDate(m, subsequentDocs.microcycles);
        if (effectiveStart == null) continue;

        // Only shift mesocycles that start after the moved one
        if (movedStart != null && effectiveStart.getTime() <= movedStart.getTime()) continue;

        WorkoutMesocycleService.shiftMesocycleDates(
          m,
          subsequentDocs.microcycles,
          subsequentDocs.sessions,
          daysDelta
        );
        this.prepareDocsForSave({ update: [m] }, apiOptions);
        microcycleMapService.prepareDocsForSave({ update: subsequentDocs.microcycles }, apiOptions);
        sessionMapService.prepareDocsForSave({ update: subsequentDocs.sessions }, apiOptions);
      }
    }

    WorkoutAPIService.queryApi(apiOptions);
  }

  /**
   * Deletes an unstarted (future) mesocycle and all its associated documents.
   *
   * @param mesocycleId The ID of the mesocycle to delete.
   */
  deleteMesocycle(mesocycleId: UUID): void {
    const docs = this.getAssociatedDocsForMesocycle(mesocycleId);

    const apiOptions = this.prepareDocsForSave({ delete: [mesocycleId] });
    this.batchChildDocSaves(apiOptions, { delete: docs });

    WorkoutAPIService.queryApi(apiOptions);
  }
}

export default new MesocycleDocumentMapService();
