<script lang="ts">
  import type { WorkoutExercise } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import MockData from '$testUtils/MockData';
  import Button from '$ui/Button/Button.svelte';
  import { calibrationFormDialog } from './SingletonCalibrationFormDialog.svelte';
  import SingletonCalibrationFormDialog from './SingletonCalibrationFormDialog.svelte';

  let exercises = $state<WorkoutExercise[]>([]);

  $effect(() => {
    untrack(() => {
      MockData.resetAll();

      const baseData = MockData.setupBaseData();
      exercises = baseData.exercises;
    });

    return () => {
      untrack(() => {
        MockData.resetAll();
      });
    };
  });
</script>

<div class="flex flex-col gap-3 p-4">
  <h3 class="text-sm font-medium">Calibration Form Dialog</h3>
  <div class="flex flex-wrap gap-2">
    {#if exercises[0]}
      <Button onclick={() => calibrationFormDialog.open(exercises[0])}>
        Add Calibration for "{exercises[0].exerciseName}"
      </Button>
    {/if}
  </div>
</div>
<SingletonCalibrationFormDialog />
