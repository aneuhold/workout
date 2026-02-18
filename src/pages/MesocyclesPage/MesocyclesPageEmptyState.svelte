<!--
  @component

  Empty state placeholder shown when the user has no mesocycles.
  Shows onboarding guidance based on how many exercises have calibrations.
-->
<script lang="ts">
  import { IconCalendar, IconChevronRight } from '@tabler/icons-svelte';
  import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
  import Button from '$ui/Button/Button.svelte';

  let calibratedExerciseCount = $derived(
    new Set(exerciseCalibrationMapService.getDocs().map((c) => c.workoutExerciseId)).size
  );
</script>

<div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
  <IconCalendar size={48} class="mb-3 opacity-40" />
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
    <p class="font-medium">No mesocycles yet</p>
    <p class="text-xs">Tap New to create your first training plan.</p>
  {/if}
</div>
