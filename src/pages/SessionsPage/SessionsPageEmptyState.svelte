<!--
  @component

  Empty state shown when there is no active mesocycle.
  Shows onboarding guidance based on how many exercises have calibrations.
-->
<script lang="ts">
  import { IconBarbell, IconChevronRight } from '@tabler/icons-svelte';
  import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
  import Button from '$ui/Button/Button.svelte';

  let calibratedExerciseCount = $derived(
    new Set(exerciseCalibrationMapService.getDocs().map((c) => c.workoutExerciseId)).size
  );
</script>

<div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
  <IconBarbell size={48} class="mb-3 opacity-40" />
  {#if calibratedExerciseCount === 0}
    <p class="font-medium">Getting started is easy!</p>
    <p class="mb-4 max-w-xs text-center text-xs">
      Set up 3-4 exercises with calibrations in the Library first. This might take roughly a week so
      you have enough rest between calibrations. Then the app can plan your sets and progression.
    </p>
    <Button variant="outline" size="sm" href="/library">
      Go to Library
      <IconChevronRight size={14} />
    </Button>
  {:else if calibratedExerciseCount < 4}
    <p class="font-medium">You're on your way!</p>
    <p class="mb-4 max-w-xs text-center text-xs">
      {calibratedExerciseCount} exercise{calibratedExerciseCount === 1 ? '' : 's'} calibrated. Add a few
      more to get the best results from your mesocycle. (Aim for at least 4, but more the merrier!)
    </p>
    <Button variant="outline" size="sm" href="/library">
      Go to Library
      <IconChevronRight size={14} />
    </Button>
  {:else}
    <p class="font-medium">No active mesocycle</p>
    <p class="mb-4 text-xs">Create a mesocycle to start planning sessions.</p>
    <Button variant="outline" size="sm" href="/mesocycles">
      View Mesocycles
      <IconChevronRight size={14} />
    </Button>
  {/if}
</div>
