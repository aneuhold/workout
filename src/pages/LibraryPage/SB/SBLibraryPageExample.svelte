<script lang="ts">
  import { type DocumentMap, type WorkoutExerciseCalibration } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
  import { MockDefaultExercise } from '$services/documentMapServices/exerciseMapService.mock';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import MockData from '$testUtils/MockData';
  import LibraryPage from '../LibraryPage.svelte';

  let { populateDefaultData = true }: { populateDefaultData?: boolean } = $props();

  $effect(() => {
    // Track props to re-run the effect when they change
    const populate = populateDefaultData;

    untrack(() => {
      MockData.resetAll();

      if (populate) {
        MockData.setupBaseData();

        // Remove calibration and CTO for Dumbbell Lateral Raise so the library
        // shows at least one uncalibrated exercise with the warning state
        const lateralRaise = exerciseMapService.allDocs.find(
          (e) => e.exerciseName === (MockDefaultExercise.DumbbellLateralRaise as string)
        );
        if (lateralRaise) {
          const filteredCalMap: DocumentMap<WorkoutExerciseCalibration> = {};
          for (const cal of exerciseCalibrationMapService.allDocs) {
            if (cal.workoutExerciseId !== lateralRaise._id) {
              filteredCalMap[cal._id] = cal;
            }
          }
          exerciseCalibrationMapService.setMap(filteredCalMap);
          exerciseMapService.setExerciseCTOs(
            exerciseMapService.exerciseCTOs.filter((cto) => cto._id !== lateralRaise._id)
          );
        }
      }
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

<LibraryPage />
