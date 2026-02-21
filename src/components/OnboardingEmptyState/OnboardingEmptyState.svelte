<!--
  @component

  Shared empty state with onboarding guidance based on exercise calibration progress.
  Shows contextual tips when the user has few calibrations, and page-specific
  "ready" content once they have enough.
-->
<script lang="ts">
  import { IconChevronRight } from '@tabler/icons-svelte';
  import type { Snippet } from 'svelte';
  import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
  import Button from '$ui/Button/Button.svelte';

  let {
    icon,
    readyTitle,
    readyMessage,
    readyButton
  }: {
    icon: Snippet;
    readyTitle: string;
    readyMessage: string;
    readyButton?: { label: string; href: string };
  } = $props();

  let calibratedExerciseCount = $derived(
    new Set(exerciseCalibrationMapService.getDocs().map((c) => c.workoutExerciseId)).size
  );
</script>

<div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
  {@render icon()}
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
    <p class="font-medium">{readyTitle}</p>
    {#if readyButton}
      <p class="mb-4 text-xs">{readyMessage}</p>
      <Button variant="outline" size="sm" href={readyButton.href}>
        {readyButton.label}
        <IconChevronRight size={14} />
      </Button>
    {:else}
      <p class="text-xs">{readyMessage}</p>
    {/if}
  {/if}
</div>
