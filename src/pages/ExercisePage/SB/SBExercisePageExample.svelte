<script lang="ts">
  import { type DocumentMap, type WorkoutExerciseCalibration } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import MesocycleMapServiceMock from '$services/documentMapServices/mesocycleMapService.mock';
  import MockData from '$testUtils/MockData';
  import ExercisePage from '../ExercisePage.svelte';

  let {
    isNew = false,
    notFound = false,
    noCalibration = false,
    noFatigueGuess = false
  }: {
    isNew?: boolean;
    notFound?: boolean;
    noCalibration?: boolean;
    noFatigueGuess?: boolean;
  } = $props();

  let exerciseId = $state<string | null>(null);

  $effect(() => {
    const creating = isNew;
    const missing = notFound;
    const noCal = noCalibration;
    const noFatigue = noFatigueGuess;

    untrack(() => {
      MockData.resetAll();

      const baseData = MockData.setupBaseData();
      const { exercises, calibrations, equipmentTypes } = baseData;

      // Generate a mesocycle with completed sessions so map services are
      // populated with real session/set data for CTO derivation
      const mesoData = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
        startDate: new Date('2026-01-05'),
        completedSessionCount: 10
      });
      MesocycleMapServiceMock.fillLateFields(mesoData);

      // Rebuild CTOs — bestSet/lastSessionExercise are derived from
      // the already-populated session/set map services
      MockData.exerciseMapServiceMock.setDefaultExerciseCTOs(
        calibrations,
        exercises,
        equipmentTypes
      );

      if (missing) {
        exerciseId = 'non-existent-id';
      } else if (noCal) {
        const exercise = exercises[0];
        exerciseId = exercise._id;
        // Rebuild calibration map without this exercise's calibrations
        const filteredMap: DocumentMap<WorkoutExerciseCalibration> = {};
        for (const cal of exerciseCalibrationMapService.allDocs) {
          if (cal.workoutExerciseId !== exercise._id) {
            filteredMap[cal._id] = cal;
          }
        }
        exerciseCalibrationMapService.setMap(filteredMap);
        exerciseMapService.setExerciseCTOs([]);
      } else if (noFatigue) {
        // Dumbbell Lateral Raise (index 3) — no initial fatigue guess
        exerciseId = exercises[3]._id;
      } else {
        exerciseId = creating ? null : exercises[0]._id;
      }
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

<ExercisePage {exerciseId} {isNew} />
