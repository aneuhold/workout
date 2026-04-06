<!--
  @component

  Recovery section for an exercise card.
  Shows the Soreness slider (deferred in Active, interactive in Review/View when not locked).
-->
<script lang="ts">
  import type { WorkoutSessionExercise } from '@aneuhold/core-ts-db-lib';
  import sharedTextConstants from '$util/sharedTextConstants';
  import SessionPageDeferredField from '../SessionPageDeferredField.svelte';
  import SessionPageSliderField from '../SessionPageSliderField.svelte';
  import { SessionPageMode, SessionPageSliderColorMode } from '../sessionPageTypes';
  import { updateSoreness } from './exerciseCardUtils';

  let {
    sessionExercise,
    mode,
    sorenessLocked
  }: {
    sessionExercise: WorkoutSessionExercise;
    mode: SessionPageMode;
    sorenessLocked: boolean;
  } = $props();
</script>

<div class="flex flex-col gap-3">
  <h3 class="text-sm font-medium">Recovery</h3>

  {#if mode === SessionPageMode.Active}
    <SessionPageDeferredField
      label="Soreness"
      reason="DOMS typically appears 24–48 hours after training"
    />
  {:else}
    <SessionPageSliderField
      label="Soreness"
      value={sessionExercise.sorenessScore ?? null}
      descriptions={sharedTextConstants.sorenessDescriptions}
      colorMode={SessionPageSliderColorMode.Negative}
      disabled={mode === SessionPageMode.Locked ||
        (mode === SessionPageMode.View && sorenessLocked)}
      highlight={mode === SessionPageMode.Review}
      onValueChange={(v) => updateSoreness(sessionExercise._id, v)}
    />
    {#if mode === SessionPageMode.View && !sorenessLocked}
      <p class="text-xs text-muted-foreground">Adjustable until you perform this exercise again.</p>
    {/if}
  {/if}
</div>
