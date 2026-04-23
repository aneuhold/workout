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
  import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
  import setMapService from '$services/documentMapServices/setMapService.svelte';
  import Button from '$ui/Button/Button.svelte';
  import OnboardingChecklist from './OnboardingChecklist.svelte';
  import { shouldShowOnboardingChecklist } from './onboardingEmptyStateUtils';

  type ReadyButton = { label: string; onclick: () => void };

  let {
    icon,
    readyTitle,
    readyMessage,
    readyButtons = []
  }: {
    icon: Snippet;
    readyTitle: string;
    readyMessage: string;
    readyButtons?: ReadyButton[];
  } = $props();

  let calibratedExerciseCount = $derived(
    new Set(exerciseCalibrationMapService.allDocs.map((c) => c.workoutExerciseId)).size
  );

  let showChecklist = $derived(
    shouldShowOnboardingChecklist(mesocycleMapService.allDocs, setMapService.allDocs)
  );
</script>

{#if showChecklist}
  <div class="flex flex-col items-center justify-center py-12">
    <OnboardingChecklist />
  </div>
{:else}
  <div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
    {@render icon()}
    {#if calibratedExerciseCount === 0}
      <p class="font-medium">Getting started is easy!</p>
      <p class="mb-4 max-w-xs text-center text-xs">
        Want to jump right in? Start a free-form workout. For planned progression, set up 3-4
        exercises with calibrations in the Library first.
      </p>
      <Button variant="outline" size="sm" href="/library">
        Go to Library
        <IconChevronRight size={14} />
      </Button>
    {:else if calibratedExerciseCount < 4}
      <p class="font-medium">You're on your way!</p>
      <p class="mb-4 max-w-xs text-center text-xs">
        {calibratedExerciseCount} exercise{calibratedExerciseCount === 1 ? '' : 's'} calibrated. Add a
        few more to get the best results from your mesocycle. You can also start a free-form workout anytime.
      </p>
      <Button variant="outline" size="sm" href="/library">
        Go to Library
        <IconChevronRight size={14} />
      </Button>
    {:else}
      <p class="font-medium">{readyTitle}</p>
      {#if readyButtons.length > 0}
        <p class="mb-4 text-xs">{readyMessage}</p>
        <div class="flex flex-wrap items-center justify-center gap-2">
          {#each readyButtons as button (button.label)}
            <Button variant="outline" size="sm" onclick={button.onclick}>
              {button.label}
              <IconChevronRight size={14} />
            </Button>
          {/each}
        </div>
      {:else}
        <p class="text-xs">{readyMessage}</p>
      {/if}
    {/if}
  </div>
{/if}
