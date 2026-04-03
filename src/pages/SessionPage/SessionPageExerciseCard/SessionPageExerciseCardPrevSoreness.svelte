<!--
  @component

  Displays the previous session's soreness score for an exercise.
  Shown during Active mode until the first set is logged, so the user can update it before training.
-->
<script lang="ts">
  import type { WorkoutSessionExercise } from '@aneuhold/core-ts-db-lib';
  import Separator from '$ui/Separator/Separator.svelte';
  import sharedTextConstants from '$util/sharedTextConstants';
  import SessionPageSliderField from '../SessionPageSliderField.svelte';
  import { SessionPageSliderColorMode } from '../sessionPageTypes';
  import { updatePreviousSoreness } from './exerciseCardUtils';

  let {
    previousSessionExercise
  }: {
    previousSessionExercise: WorkoutSessionExercise;
  } = $props();
</script>

<div class="flex flex-col gap-2 rounded-lg border border-dashed border-muted-foreground/30 p-3">
  <div class="flex items-center justify-between">
    <h4 class="text-xs font-medium text-muted-foreground">Previous Session Soreness</h4>
    <span class="text-xs text-muted-foreground">
      {new Date(previousSessionExercise.createdDate).toLocaleDateString()}
    </span>
  </div>
  <SessionPageSliderField
    label="Soreness"
    value={previousSessionExercise.sorenessScore ?? null}
    descriptions={sharedTextConstants.sorenessDescriptions}
    colorMode={SessionPageSliderColorMode.Negative}
    highlight={previousSessionExercise.sorenessScore == null}
    onValueChange={(v) => updatePreviousSoreness(previousSessionExercise._id, v)}
  />
</div>
<Separator />
