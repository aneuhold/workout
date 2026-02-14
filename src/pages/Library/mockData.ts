import type { EquipmentItem, Exercise, MuscleGroup } from './Library.svelte';

export const mockExercises: Exercise[] = [
  {
    id: 'ex-1',
    name: 'Barbell Bench Press',
    equipment: 'Barbell',
    progressionType: 'Load',
    restTime: 180,
    repRange: '4-6',
    repRangeCategory: 'Strength',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Front Delts', 'Triceps'],
    calibration: {
      date: '2025-12-15',
      weight: 185,
      reps: 5,
      estimated1RM: 208
    }
  },
  {
    id: 'ex-2',
    name: 'Pull-ups',
    equipment: 'Bodyweight',
    progressionType: 'Rep',
    restTime: 120,
    repRange: '6-12',
    repRangeCategory: 'Hypertrophy',
    primaryMuscles: ['Lats'],
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    notes: 'Use wide grip for more lat activation.'
  },
  {
    id: 'ex-3',
    name: 'Barbell Squat',
    equipment: 'Barbell',
    progressionType: 'Load',
    restTime: 180,
    repRange: '4-6',
    repRangeCategory: 'Strength',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings'],
    calibration: {
      date: '2025-12-20',
      weight: 275,
      reps: 5,
      estimated1RM: 309
    }
  },
  {
    id: 'ex-4',
    name: 'Dumbbell Lateral Raise',
    equipment: 'Dumbbells',
    progressionType: 'Load',
    restTime: 60,
    repRange: '12-20',
    repRangeCategory: 'Endurance',
    primaryMuscles: ['Side Delts'],
    secondaryMuscles: []
  },
  {
    id: 'ex-5',
    name: 'Cable Tricep Pushdown',
    equipment: 'Cable Machine',
    progressionType: 'Load',
    restTime: 90,
    repRange: '8-12',
    repRangeCategory: 'Hypertrophy',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: [],
    calibration: {
      date: '2025-11-28',
      weight: 60,
      reps: 10,
      estimated1RM: 80
    }
  },
  {
    id: 'ex-6',
    name: 'Romanian Deadlift',
    equipment: 'Barbell',
    progressionType: 'Load',
    restTime: 120,
    repRange: '6-10',
    repRangeCategory: 'Hypertrophy',
    primaryMuscles: ['Hamstrings', 'Glutes'],
    secondaryMuscles: ['Lats'],
    notes: 'Focus on hip hinge; keep bar close to legs.'
  },
  {
    id: 'ex-7',
    name: 'Incline Dumbbell Press',
    equipment: 'Dumbbells',
    progressionType: 'Load',
    restTime: 120,
    repRange: '8-12',
    repRangeCategory: 'Hypertrophy',
    primaryMuscles: ['Chest', 'Front Delts'],
    secondaryMuscles: ['Triceps'],
    calibration: {
      date: '2026-01-05',
      weight: 65,
      reps: 8,
      estimated1RM: 80
    }
  }
];

export const mockMuscleGroups: MuscleGroup[] = [
  { id: 'mg-1', name: 'Chest' },
  { id: 'mg-2', name: 'Lats', notes: 'Largest back muscle; key for pull movements.' },
  { id: 'mg-3', name: 'Quadriceps' },
  { id: 'mg-4', name: 'Hamstrings' },
  { id: 'mg-5', name: 'Glutes' },
  { id: 'mg-6', name: 'Front Delts' },
  { id: 'mg-7', name: 'Side Delts' },
  { id: 'mg-8', name: 'Rear Delts' },
  { id: 'mg-9', name: 'Triceps' },
  { id: 'mg-10', name: 'Biceps' }
];

export const mockEquipment: EquipmentItem[] = [
  { id: 'eq-1', name: 'Barbell', notes: 'Standard Olympic barbell (45 lb / 20 kg).' },
  { id: 'eq-2', name: 'Dumbbells' },
  { id: 'eq-3', name: 'Cable Machine' },
  { id: 'eq-4', name: 'Bodyweight' },
  { id: 'eq-5', name: 'Resistance Band' }
];
