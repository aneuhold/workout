import {
  ExerciseProgressionType,
  ExerciseRepRange,
  type Fatigue,
  type WorkoutEquipmentType,
  type WorkoutExercise,
  WorkoutExerciseSchema,
  type WorkoutMuscleGroup
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import TestUsers from '$testUtils/TestUsers';
import { MockDefaultEquipmentType } from './equipmentTypeMapService.mock';
import exerciseMapService from './exerciseMapService.svelte';
import { MockDefaultMuscleGroup } from './muscleGroupMapService.mock';

export enum MockDefaultExercise {
  BarbellBenchPress = 'Barbell Bench Press',
  Pullups = 'Pull-ups',
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

export default class ExerciseMapServiceMock {
  reset(): void {
    exerciseMapService.setMap({});
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
        exerciseName: MockDefaultExercise.Pullups,
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
