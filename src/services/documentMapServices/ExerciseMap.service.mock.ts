import {
  ExerciseProgressionType,
  ExerciseRepRange,
  type Fatigue,
  type WorkoutEquipmentType,
  type WorkoutExercise,
  type WorkoutExerciseCalibration,
  WorkoutExerciseCalibrationService,
  type WorkoutExerciseCTO,
  WorkoutExerciseCTOSchema,
  WorkoutExerciseSchema,
  type WorkoutSessionExercise,
  WorkoutSessionExerciseService,
  type WorkoutSet
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import TestUsers from '$testUtils/TestUsers';
import EquipmentTypeMapServiceMock, {
  MockDefaultEquipmentType
} from './equipmentTypeMapService.mock';
import exerciseMapService from './exerciseMapService.svelte';
import MuscleGroupMapServiceMock, { MockDefaultMuscleGroup } from './muscleGroupMapService.mock';
import sessionExerciseMapService from './sessionExerciseMapService.svelte';
import sessionMapService from './sessionMapService.svelte';
import setMapService from './setMapService.svelte';

export enum MockDefaultExercise {
  BarbellBenchPress = 'Barbell Bench Press',
  PullUps = 'Pull-ups',
  BarbellSquat = 'Barbell Squat',
  DumbbellLateralRaise = 'Dumbbell Lateral Raise',
  CableTricepPushdown = 'Cable Tricep Pushdown',
  RomanianDeadlift = 'Romanian Deadlift',
  InclineDumbbellPress = 'Incline Dumbbell Press',
  BarbellRow = 'Barbell Row',
  BulgarianSplitSquat = 'Bulgarian Split Squat',
  BarbellCurl = 'Barbell Curl',
  CableFacePull = 'Cable Face Pull',
  HipThrust = 'Hip Thrust'
}

export type AddMockExerciseInfo = {
  exerciseName: string;
  workoutEquipmentTypeId: UUID;
  repRange: ExerciseRepRange;
  preferredProgressionType?: ExerciseProgressionType;
  primaryMuscleGroups?: UUID[];
  secondaryMuscleGroups?: UUID[];
  restSeconds?: number;
  notes?: string;
  initialFatigueGuess?: Fatigue;
};

type DerivedExerciseCTOFields = Pick<
  WorkoutExerciseCTO,
  | 'bestSet'
  | 'lastSessionExercise'
  | 'lastSessionSets'
  | 'lastAccumulationSessionExercise'
  | 'lastAccumulationSessionSets'
>;

export default class ExerciseMapServiceMock {
  static readonly defaultExercises: Record<MockDefaultExercise, WorkoutExercise> = {
    [MockDefaultExercise.BarbellBenchPress]: this.createExercise({
      exerciseName: MockDefaultExercise.BarbellBenchPress,
      workoutEquipmentTypeId:
        EquipmentTypeMapServiceMock.defaultEquipmentTypes[MockDefaultEquipmentType.Barbell]._id,
      repRange: ExerciseRepRange.Heavy,
      preferredProgressionType: ExerciseProgressionType.Load,
      primaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Chest]._id
      ],
      secondaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.FrontDelts]._id,
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Triceps]._id
      ],
      restSeconds: 180,
      initialFatigueGuess: {
        jointAndTissueDisruption: 1,
        perceivedEffort: 2,
        unusedMusclePerformance: 1
      }
    }),
    [MockDefaultExercise.PullUps]: this.createExercise({
      exerciseName: MockDefaultExercise.PullUps,
      workoutEquipmentTypeId:
        EquipmentTypeMapServiceMock.defaultEquipmentTypes[MockDefaultEquipmentType.Bodyweight]._id,
      repRange: ExerciseRepRange.Medium,
      preferredProgressionType: ExerciseProgressionType.Rep,
      primaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Lats]._id
      ],
      secondaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Biceps]._id,
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.RearDelts]._id
      ],
      restSeconds: 120,
      notes: 'Use wide grip for more lat activation.',
      initialFatigueGuess: {
        jointAndTissueDisruption: 0,
        perceivedEffort: 1,
        unusedMusclePerformance: 1
      }
    }),
    [MockDefaultExercise.BarbellSquat]: this.createExercise({
      exerciseName: MockDefaultExercise.BarbellSquat,
      workoutEquipmentTypeId:
        EquipmentTypeMapServiceMock.defaultEquipmentTypes[MockDefaultEquipmentType.Barbell]._id,
      repRange: ExerciseRepRange.Heavy,
      preferredProgressionType: ExerciseProgressionType.Load,
      primaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Quadriceps]._id,
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Glutes]._id
      ],
      secondaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Hamstrings]._id
      ],
      restSeconds: 180,
      initialFatigueGuess: {
        jointAndTissueDisruption: 2,
        perceivedEffort: 3,
        unusedMusclePerformance: 2
      }
    }),
    // Dumbbell Lateral Raise intentionally has no fatigue guess
    [MockDefaultExercise.DumbbellLateralRaise]: this.createExercise({
      exerciseName: MockDefaultExercise.DumbbellLateralRaise,
      workoutEquipmentTypeId:
        EquipmentTypeMapServiceMock.defaultEquipmentTypes[MockDefaultEquipmentType.Dumbbells]._id,
      repRange: ExerciseRepRange.Light,
      preferredProgressionType: ExerciseProgressionType.Load,
      primaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.SideDelts]._id
      ],
      restSeconds: 60
    }),
    [MockDefaultExercise.CableTricepPushdown]: this.createExercise({
      exerciseName: MockDefaultExercise.CableTricepPushdown,
      workoutEquipmentTypeId:
        EquipmentTypeMapServiceMock.defaultEquipmentTypes[MockDefaultEquipmentType.CableMachine]
          ._id,
      repRange: ExerciseRepRange.Medium,
      preferredProgressionType: ExerciseProgressionType.Load,
      primaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Triceps]._id
      ],
      restSeconds: 90,
      initialFatigueGuess: {
        jointAndTissueDisruption: 0,
        perceivedEffort: 1,
        unusedMusclePerformance: 0
      }
    }),
    [MockDefaultExercise.RomanianDeadlift]: this.createExercise({
      exerciseName: MockDefaultExercise.RomanianDeadlift,
      workoutEquipmentTypeId:
        EquipmentTypeMapServiceMock.defaultEquipmentTypes[MockDefaultEquipmentType.Barbell]._id,
      repRange: ExerciseRepRange.Medium,
      preferredProgressionType: ExerciseProgressionType.Load,
      primaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Hamstrings]._id,
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Glutes]._id
      ],
      secondaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Lats]._id
      ],
      restSeconds: 120,
      notes: 'Focus on hip hinge; keep bar close to legs.',
      initialFatigueGuess: {
        jointAndTissueDisruption: 1,
        perceivedEffort: 2,
        unusedMusclePerformance: 2
      }
    }),
    [MockDefaultExercise.InclineDumbbellPress]: this.createExercise({
      exerciseName: MockDefaultExercise.InclineDumbbellPress,
      workoutEquipmentTypeId:
        EquipmentTypeMapServiceMock.defaultEquipmentTypes[MockDefaultEquipmentType.Dumbbells]._id,
      repRange: ExerciseRepRange.Medium,
      preferredProgressionType: ExerciseProgressionType.Load,
      primaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Chest]._id,
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.FrontDelts]._id
      ],
      secondaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Triceps]._id
      ],
      restSeconds: 120,
      initialFatigueGuess: {
        jointAndTissueDisruption: 1,
        perceivedEffort: 1,
        unusedMusclePerformance: 1
      }
    }),
    [MockDefaultExercise.BarbellRow]: this.createExercise({
      exerciseName: MockDefaultExercise.BarbellRow,
      workoutEquipmentTypeId:
        EquipmentTypeMapServiceMock.defaultEquipmentTypes[MockDefaultEquipmentType.Barbell]._id,
      repRange: ExerciseRepRange.Heavy,
      preferredProgressionType: ExerciseProgressionType.Load,
      primaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Lats]._id
      ],
      secondaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Biceps]._id,
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.RearDelts]._id
      ],
      restSeconds: 150,
      initialFatigueGuess: {
        jointAndTissueDisruption: 1,
        perceivedEffort: 2,
        unusedMusclePerformance: 1
      }
    }),
    [MockDefaultExercise.BulgarianSplitSquat]: this.createExercise({
      exerciseName: MockDefaultExercise.BulgarianSplitSquat,
      workoutEquipmentTypeId:
        EquipmentTypeMapServiceMock.defaultEquipmentTypes[MockDefaultEquipmentType.Dumbbells]._id,
      repRange: ExerciseRepRange.Medium,
      preferredProgressionType: ExerciseProgressionType.Load,
      primaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Quadriceps]._id
      ],
      secondaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Glutes]._id
      ],
      restSeconds: 120,
      initialFatigueGuess: {
        jointAndTissueDisruption: 1,
        perceivedEffort: 2,
        unusedMusclePerformance: 1
      }
    }),
    [MockDefaultExercise.BarbellCurl]: this.createExercise({
      exerciseName: MockDefaultExercise.BarbellCurl,
      workoutEquipmentTypeId:
        EquipmentTypeMapServiceMock.defaultEquipmentTypes[MockDefaultEquipmentType.Barbell]._id,
      repRange: ExerciseRepRange.Medium,
      preferredProgressionType: ExerciseProgressionType.Load,
      primaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Biceps]._id
      ],
      restSeconds: 90,
      initialFatigueGuess: {
        jointAndTissueDisruption: 0,
        perceivedEffort: 1,
        unusedMusclePerformance: 0
      }
    }),
    [MockDefaultExercise.CableFacePull]: this.createExercise({
      exerciseName: MockDefaultExercise.CableFacePull,
      workoutEquipmentTypeId:
        EquipmentTypeMapServiceMock.defaultEquipmentTypes[MockDefaultEquipmentType.CableMachine]
          ._id,
      repRange: ExerciseRepRange.Light,
      preferredProgressionType: ExerciseProgressionType.Rep,
      primaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.RearDelts]._id
      ],
      secondaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.SideDelts]._id
      ],
      restSeconds: 60,
      initialFatigueGuess: {
        jointAndTissueDisruption: 0,
        perceivedEffort: 1,
        unusedMusclePerformance: 0
      }
    }),
    [MockDefaultExercise.HipThrust]: this.createExercise({
      exerciseName: MockDefaultExercise.HipThrust,
      workoutEquipmentTypeId:
        EquipmentTypeMapServiceMock.defaultEquipmentTypes[MockDefaultEquipmentType.Barbell]._id,
      repRange: ExerciseRepRange.Heavy,
      preferredProgressionType: ExerciseProgressionType.Load,
      primaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Glutes]._id
      ],
      secondaryMuscleGroups: [
        MuscleGroupMapServiceMock.defaultMuscleGroups[MockDefaultMuscleGroup.Hamstrings]._id
      ],
      restSeconds: 150,
      initialFatigueGuess: {
        jointAndTissueDisruption: 0,
        perceivedEffort: 2,
        unusedMusclePerformance: 1
      }
    })
  };

  reset(): void {
    exerciseMapService.setMap({});
    exerciseMapService.setExerciseCTOs([]);
  }

  addDefaultExercises(): WorkoutExercise[] {
    const docs = Object.values(ExerciseMapServiceMock.defaultExercises);
    for (const doc of docs) {
      exerciseMapService.addDocWithoutPersist(doc);
    }
    return docs;
  }

  addExercise(options: AddMockExerciseInfo): WorkoutExercise {
    const doc = ExerciseMapServiceMock.createExercise(options);
    exerciseMapService.addDocWithoutPersist(doc);
    return doc;
  }

  static createExercise(options: AddMockExerciseInfo): WorkoutExercise {
    return WorkoutExerciseSchema.parse({
      userId: TestUsers.currentUserCto._id,
      exerciseName: options.exerciseName,
      workoutEquipmentTypeId: options.workoutEquipmentTypeId,
      repRange: options.repRange,
      preferredProgressionType: options.preferredProgressionType,
      primaryMuscleGroups: options.primaryMuscleGroups ?? [],
      secondaryMuscleGroups: options.secondaryMuscleGroups ?? [],
      restSeconds: options.restSeconds,
      notes: options.notes,
      initialFatigueGuess: options.initialFatigueGuess ?? {}
    });
  }

  /**
   * Builds exercise CTOs from calibrations, exercises, and equipment types,
   * and sets them on the exercise map service.
   *
   * If session/set map services are populated, bestSet, lastSession*, and
   * lastAccumulationSession* fields are derived automatically from those
   * services. Otherwise, those fields default to null/empty.
   *
   * @param calibrations The calibrations to build CTOs from
   * @param exercises The exercises to match calibrations against
   * @param equipmentTypes The equipment types to attach to CTOs
   */
  setDefaultExerciseCTOs(
    calibrations: WorkoutExerciseCalibration[],
    exercises: WorkoutExercise[],
    equipmentTypes: WorkoutEquipmentType[]
  ): WorkoutExerciseCTO[] {
    const hasSessionData = sessionMapService.allDocs.length > 0;
    const derivedFields = hasSessionData
      ? ExerciseMapServiceMock.deriveCTOFields()
      : new Map<UUID, DerivedExerciseCTOFields>();

    const exerciseCTOs = calibrations.map((cal) => {
      const exercise = exercises.find((e) => e._id === cal.workoutExerciseId);
      const equipmentType = equipmentTypes.find(
        (et) => et._id === exercise?.workoutEquipmentTypeId
      );
      const derived = exercise ? derivedFields.get(exercise._id) : undefined;
      return WorkoutExerciseCTOSchema.parse({
        ...exercise,
        equipmentType,
        bestCalibration: cal,
        bestSet: derived?.bestSet ?? null,
        lastSessionExercise: derived?.lastSessionExercise ?? null,
        lastSessionSets: derived?.lastSessionSets,
        lastAccumulationSessionExercise: derived?.lastAccumulationSessionExercise ?? null,
        lastAccumulationSessionSets: derived?.lastAccumulationSessionSets
      });
    });
    exerciseMapService.setExerciseCTOs(exerciseCTOs);
    return exerciseCTOs;
  }

  /**
   * Derives bestSet, lastSession*, and lastAccumulationSession* per exercise
   * from the already-populated session, session exercise, and set map services.
   *
   * Uses intermediary maps keyed by exercise ID for efficient lookup:
   * - Best set: the completed set with the highest 1RM per exercise
   * - Last session exercise: the most recently created session exercise per
   *   exercise (from completed sessions, any cycle type)
   * - Last accumulation session exercise: same as above, but excluding deload
   *   sessions
   * - Sets arrays: all sets from each variant's setOrder
   */
  private static deriveCTOFields(): Map<UUID, DerivedExerciseCTOFields> {
    const completedSessionIds = new Set<UUID>();
    for (const session of sessionMapService.allDocs) {
      if (session.complete) {
        completedSessionIds.add(session._id);
      }
    }

    // Find best set per exercise (highest 1RM among completed sets)
    const bestSetByExercise = new Map<UUID, WorkoutSet>();
    const bestSetOneRMByExercise = new Map<UUID, number>();

    for (const set of setMapService.allDocs) {
      if (
        !completedSessionIds.has(set.workoutSessionId) ||
        set.actualWeight == null ||
        !set.actualReps ||
        set.actualReps <= 0
      ) {
        continue;
      }
      const oneRM = WorkoutExerciseCalibrationService.get1RMRaw(set.actualWeight, set.actualReps);
      const currentBest = bestSetOneRMByExercise.get(set.workoutExerciseId);
      if (currentBest === undefined || oneRM > currentBest) {
        bestSetByExercise.set(set.workoutExerciseId, set);
        bestSetOneRMByExercise.set(set.workoutExerciseId, oneRM);
      }
    }

    // Find last session exercise (any cycle type) and last accumulation session
    // exercise (non-deload) per exercise (most recent from completed sessions).
    const exerciseToLastSEMap = new Map<UUID, WorkoutSessionExercise>();
    const exerciseToLastAccumulationSEMap = new Map<UUID, WorkoutSessionExercise>();

    for (const se of sessionExerciseMapService.allDocs) {
      if (!completedSessionIds.has(se.workoutSessionId)) continue;
      const seSets = setMapService.allDocs.filter((s) => s.workoutSessionExerciseId === se._id);

      const currentLatest = exerciseToLastSEMap.get(se.workoutExerciseId);
      if (!currentLatest || se.createdDate > currentLatest.createdDate) {
        exerciseToLastSEMap.set(se.workoutExerciseId, se);
      }

      // Skip deload exercises for the accumulation variant
      if (WorkoutSessionExerciseService.isDeloadExercise(seSets)) continue;
      const currentAccum = exerciseToLastAccumulationSEMap.get(se.workoutExerciseId);
      if (!currentAccum || se.createdDate > currentAccum.createdDate) {
        exerciseToLastAccumulationSEMap.set(se.workoutExerciseId, se);
      }
    }

    const resolveSetsForSE = (se: WorkoutSessionExercise | null): WorkoutSet[] => {
      if (!se) return [];
      return se.setOrder
        .map((setId) => setMapService.getDoc(setId))
        .filter((s): s is WorkoutSet => s != null);
    };

    // Build result map
    const result = new Map<UUID, DerivedExerciseCTOFields>();
    const allExerciseIds = new Set([
      ...bestSetByExercise.keys(),
      ...exerciseToLastSEMap.keys(),
      ...exerciseToLastAccumulationSEMap.keys()
    ]);

    for (const exerciseId of allExerciseIds) {
      const lastSE = exerciseToLastSEMap.get(exerciseId) ?? null;
      const lastAccumulationSE = exerciseToLastAccumulationSEMap.get(exerciseId) ?? null;

      result.set(exerciseId, {
        bestSet: bestSetByExercise.get(exerciseId) ?? null,
        lastSessionExercise: lastSE,
        lastSessionSets: resolveSetsForSE(lastSE),
        lastAccumulationSessionExercise: lastAccumulationSE,
        lastAccumulationSessionSets: resolveSetsForSE(lastAccumulationSE)
      });
    }

    return result;
  }
}
