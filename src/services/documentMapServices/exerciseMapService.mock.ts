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
  type WorkoutMuscleGroup,
  type WorkoutSessionExercise,
  type WorkoutSet
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import TestUsers from '$testUtils/TestUsers';
import { MockDefaultEquipmentType } from './equipmentTypeMapService.mock';
import exerciseMapService from './exerciseMapService.svelte';
import { MockDefaultMuscleGroup } from './muscleGroupMapService.mock';
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
  'bestSet' | 'lastSessionExercise' | 'lastFirstSet'
>;

export default class ExerciseMapServiceMock {
  reset(): void {
    exerciseMapService.setMap({});
    exerciseMapService.setExerciseCTOs([]);
  }

  addExercise(options: AddMockExerciseInfo): WorkoutExercise {
    const doc = WorkoutExerciseSchema.parse({
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
    exerciseMapService.addDocWithoutPersist(doc);
    return doc;
  }

  /**
   * Builds exercise CTOs from calibrations, exercises, and equipment types,
   * and sets them on the exercise map service.
   *
   * If session/set map services are populated, bestSet, lastSessionExercise,
   * and lastFirstSet are derived automatically from those services. Otherwise,
   * those fields default to null.
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
        lastFirstSet: derived?.lastFirstSet ?? null
      });
    });
    exerciseMapService.setExerciseCTOs(exerciseCTOs);
    return exerciseCTOs;
  }

  /**
   * Derives bestSet, lastSessionExercise, and lastFirstSet per exercise
   * from the already-populated session, session exercise, and set map services.
   *
   * Uses intermediary maps keyed by exercise ID for efficient lookup:
   * - Best set: the completed set with the highest 1RM per exercise
   * - Last session exercise: the most recently created session exercise per
   *   exercise (from completed sessions only)
   * - Last first set: the first set from that last session exercise's setOrder
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

    // Find last session exercise per exercise (most recent from completed sessions)
    const exerciseToLastSessionExerciseMap = new Map<UUID, WorkoutSessionExercise>();

    for (const se of sessionExerciseMapService.allDocs) {
      if (!completedSessionIds.has(se.workoutSessionId)) continue;
      const current = exerciseToLastSessionExerciseMap.get(se.workoutExerciseId);
      if (!current || se.createdDate > current.createdDate) {
        exerciseToLastSessionExerciseMap.set(se.workoutExerciseId, se);
      }
    }

    // Build result map
    const result = new Map<UUID, DerivedExerciseCTOFields>();
    const allExerciseIds = new Set([
      ...bestSetByExercise.keys(),
      ...exerciseToLastSessionExerciseMap.keys()
    ]);

    for (const exerciseId of allExerciseIds) {
      const lastSE = exerciseToLastSessionExerciseMap.get(exerciseId) ?? null;
      const firstSetId = lastSE?.setOrder[0];
      const lastFirstSet = firstSetId ? (setMapService.getDoc(firstSetId) ?? null) : null;

      result.set(exerciseId, {
        bestSet: bestSetByExercise.get(exerciseId) ?? null,
        lastSessionExercise: lastSE,
        lastFirstSet
      });
    }

    return result;
  }

  addDefaultExercises(
    muscleGroups: Record<MockDefaultMuscleGroup, WorkoutMuscleGroup>,
    equipment: Record<MockDefaultEquipmentType, WorkoutEquipmentType>
  ): WorkoutExercise[] {
    return [
      this.addExercise({
        exerciseName: MockDefaultExercise.BarbellBenchPress,
        workoutEquipmentTypeId: equipment[MockDefaultEquipmentType.Barbell]._id,
        repRange: ExerciseRepRange.Heavy,
        preferredProgressionType: ExerciseProgressionType.Load,
        primaryMuscleGroups: [muscleGroups[MockDefaultMuscleGroup.Chest]._id],
        secondaryMuscleGroups: [
          muscleGroups[MockDefaultMuscleGroup.FrontDelts]._id,
          muscleGroups[MockDefaultMuscleGroup.Triceps]._id
        ],
        restSeconds: 180,
        initialFatigueGuess: {
          jointAndTissueDisruption: 1,
          perceivedEffort: 2,
          unusedMusclePerformance: 1
        }
      }),
      this.addExercise({
        exerciseName: MockDefaultExercise.PullUps,
        workoutEquipmentTypeId: equipment[MockDefaultEquipmentType.Bodyweight]._id,
        repRange: ExerciseRepRange.Medium,
        preferredProgressionType: ExerciseProgressionType.Rep,
        primaryMuscleGroups: [muscleGroups[MockDefaultMuscleGroup.Lats]._id],
        secondaryMuscleGroups: [
          muscleGroups[MockDefaultMuscleGroup.Biceps]._id,
          muscleGroups[MockDefaultMuscleGroup.RearDelts]._id
        ],
        restSeconds: 120,
        notes: 'Use wide grip for more lat activation.',
        initialFatigueGuess: {
          jointAndTissueDisruption: 0,
          perceivedEffort: 1,
          unusedMusclePerformance: 1
        }
      }),
      this.addExercise({
        exerciseName: MockDefaultExercise.BarbellSquat,
        workoutEquipmentTypeId: equipment[MockDefaultEquipmentType.Barbell]._id,
        repRange: ExerciseRepRange.Heavy,
        preferredProgressionType: ExerciseProgressionType.Load,
        primaryMuscleGroups: [
          muscleGroups[MockDefaultMuscleGroup.Quadriceps]._id,
          muscleGroups[MockDefaultMuscleGroup.Glutes]._id
        ],
        secondaryMuscleGroups: [muscleGroups[MockDefaultMuscleGroup.Hamstrings]._id],
        restSeconds: 180,
        initialFatigueGuess: {
          jointAndTissueDisruption: 2,
          perceivedEffort: 3,
          unusedMusclePerformance: 2
        }
      }),
      // Dumbbell Lateral Raise intentionally has no fatigue guess
      this.addExercise({
        exerciseName: MockDefaultExercise.DumbbellLateralRaise,
        workoutEquipmentTypeId: equipment[MockDefaultEquipmentType.Dumbbells]._id,
        repRange: ExerciseRepRange.Light,
        preferredProgressionType: ExerciseProgressionType.Load,
        primaryMuscleGroups: [muscleGroups[MockDefaultMuscleGroup.SideDelts]._id],
        restSeconds: 60
      }),
      this.addExercise({
        exerciseName: MockDefaultExercise.CableTricepPushdown,
        workoutEquipmentTypeId: equipment[MockDefaultEquipmentType.CableMachine]._id,
        repRange: ExerciseRepRange.Medium,
        preferredProgressionType: ExerciseProgressionType.Load,
        primaryMuscleGroups: [muscleGroups[MockDefaultMuscleGroup.Triceps]._id],
        restSeconds: 90,
        initialFatigueGuess: {
          jointAndTissueDisruption: 0,
          perceivedEffort: 1,
          unusedMusclePerformance: 0
        }
      }),
      this.addExercise({
        exerciseName: MockDefaultExercise.RomanianDeadlift,
        workoutEquipmentTypeId: equipment[MockDefaultEquipmentType.Barbell]._id,
        repRange: ExerciseRepRange.Medium,
        preferredProgressionType: ExerciseProgressionType.Load,
        primaryMuscleGroups: [
          muscleGroups[MockDefaultMuscleGroup.Hamstrings]._id,
          muscleGroups[MockDefaultMuscleGroup.Glutes]._id
        ],
        secondaryMuscleGroups: [muscleGroups[MockDefaultMuscleGroup.Lats]._id],
        restSeconds: 120,
        notes: 'Focus on hip hinge; keep bar close to legs.',
        initialFatigueGuess: {
          jointAndTissueDisruption: 1,
          perceivedEffort: 2,
          unusedMusclePerformance: 2
        }
      }),
      this.addExercise({
        exerciseName: MockDefaultExercise.InclineDumbbellPress,
        workoutEquipmentTypeId: equipment[MockDefaultEquipmentType.Dumbbells]._id,
        repRange: ExerciseRepRange.Medium,
        preferredProgressionType: ExerciseProgressionType.Load,
        primaryMuscleGroups: [
          muscleGroups[MockDefaultMuscleGroup.Chest]._id,
          muscleGroups[MockDefaultMuscleGroup.FrontDelts]._id
        ],
        secondaryMuscleGroups: [muscleGroups[MockDefaultMuscleGroup.Triceps]._id],
        restSeconds: 120,
        initialFatigueGuess: {
          jointAndTissueDisruption: 1,
          perceivedEffort: 1,
          unusedMusclePerformance: 1
        }
      }),
      this.addExercise({
        exerciseName: MockDefaultExercise.BarbellRow,
        workoutEquipmentTypeId: equipment[MockDefaultEquipmentType.Barbell]._id,
        repRange: ExerciseRepRange.Heavy,
        preferredProgressionType: ExerciseProgressionType.Load,
        primaryMuscleGroups: [muscleGroups[MockDefaultMuscleGroup.Lats]._id],
        secondaryMuscleGroups: [
          muscleGroups[MockDefaultMuscleGroup.Biceps]._id,
          muscleGroups[MockDefaultMuscleGroup.RearDelts]._id
        ],
        restSeconds: 150,
        initialFatigueGuess: {
          jointAndTissueDisruption: 1,
          perceivedEffort: 2,
          unusedMusclePerformance: 1
        }
      }),
      this.addExercise({
        exerciseName: MockDefaultExercise.BulgarianSplitSquat,
        workoutEquipmentTypeId: equipment[MockDefaultEquipmentType.Dumbbells]._id,
        repRange: ExerciseRepRange.Medium,
        preferredProgressionType: ExerciseProgressionType.Load,
        primaryMuscleGroups: [muscleGroups[MockDefaultMuscleGroup.Quadriceps]._id],
        secondaryMuscleGroups: [muscleGroups[MockDefaultMuscleGroup.Glutes]._id],
        restSeconds: 120,
        initialFatigueGuess: {
          jointAndTissueDisruption: 1,
          perceivedEffort: 2,
          unusedMusclePerformance: 1
        }
      }),
      this.addExercise({
        exerciseName: MockDefaultExercise.BarbellCurl,
        workoutEquipmentTypeId: equipment[MockDefaultEquipmentType.Barbell]._id,
        repRange: ExerciseRepRange.Medium,
        preferredProgressionType: ExerciseProgressionType.Load,
        primaryMuscleGroups: [muscleGroups[MockDefaultMuscleGroup.Biceps]._id],
        restSeconds: 90,
        initialFatigueGuess: {
          jointAndTissueDisruption: 0,
          perceivedEffort: 1,
          unusedMusclePerformance: 0
        }
      }),
      this.addExercise({
        exerciseName: MockDefaultExercise.CableFacePull,
        workoutEquipmentTypeId: equipment[MockDefaultEquipmentType.CableMachine]._id,
        repRange: ExerciseRepRange.Light,
        preferredProgressionType: ExerciseProgressionType.Rep,
        primaryMuscleGroups: [muscleGroups[MockDefaultMuscleGroup.RearDelts]._id],
        secondaryMuscleGroups: [muscleGroups[MockDefaultMuscleGroup.SideDelts]._id],
        restSeconds: 60,
        initialFatigueGuess: {
          jointAndTissueDisruption: 0,
          perceivedEffort: 1,
          unusedMusclePerformance: 0
        }
      }),
      this.addExercise({
        exerciseName: MockDefaultExercise.HipThrust,
        workoutEquipmentTypeId: equipment[MockDefaultEquipmentType.Barbell]._id,
        repRange: ExerciseRepRange.Heavy,
        preferredProgressionType: ExerciseProgressionType.Load,
        primaryMuscleGroups: [muscleGroups[MockDefaultMuscleGroup.Glutes]._id],
        secondaryMuscleGroups: [muscleGroups[MockDefaultMuscleGroup.Hamstrings]._id],
        restSeconds: 150,
        initialFatigueGuess: {
          jointAndTissueDisruption: 0,
          perceivedEffort: 2,
          unusedMusclePerformance: 1
        }
      })
    ];
  }
}
