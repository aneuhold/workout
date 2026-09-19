<script lang="ts">
  import { type DocumentMap, type WorkoutExerciseCalibration } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import { untrack } from 'svelte';
  import exerciseCalibrationMapService from '$services/documentMapServices/ExerciseCalibrationMap.service.svelte';
  import exerciseMapServiceMock from '$services/documentMapServices/ExerciseMap.service.mock';
  import exerciseMapService from '$services/documentMapServices/ExerciseMap.service.svelte';
  import mesocycleMapServiceMock from '$services/documentMapServices/MesocycleMap.service.mock';
  import MockDataService from '$services/MockDataService/MockData.service';
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

  let exerciseId = $state<UUID | null>(null);

  $effect(() => {
    const creating = isNew;
    const missing = notFound;
    const noCal = noCalibration;
    const noFatigue = noFatigueGuess;

    untrack(() => {
      MockDataService.resetAll();

      const baseData = MockDataService.setupBaseData();
      const { exercises, calibrations, equipmentTypes } = baseData;

      // Generate a mesocycle with completed sessions so map services are
      // populated with real session/set data for CTO derivation
      const mesoData = mesocycleMapServiceMock.generateFullMesocycle(baseData, {
        startDate: new Date('2026-01-05'),
        completedSessionCount: 10
      });
      mesocycleMapServiceMock.fillLateFields(mesoData);

      // Rebuild CTOs — bestSet/lastSessionExercise are derived from
      // the already-populated session/set map services
      exerciseMapServiceMock.setDefaultExerciseCTOs(calibrations, exercises, equipmentTypes);

      if (missing) {
        exerciseId = '00000000-0000-0000-0000-000000000000';
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
        MockDataService.resetAll();
      });
    };
  });
</script>

<ExercisePage {exerciseId} {isNew} />
