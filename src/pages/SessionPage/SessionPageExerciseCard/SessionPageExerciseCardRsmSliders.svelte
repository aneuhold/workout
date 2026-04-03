<!--
  @component

  RSM (Raw Stimulus Magnitude) slider section for an exercise card.
  Contains Mind-Muscle Connection, Pump (both immediate), and Disruption (deferred/late) sliders.
-->
<script lang="ts">
  import type { WorkoutSessionExercise } from '@aneuhold/core-ts-db-lib';
  import InfoPopover from '$components/InfoPopover/InfoPopover.svelte';
  import sharedTextConstants from '$util/sharedTextConstants';
  import SessionPageDeferredField from '../SessionPageDeferredField.svelte';
  import SessionPageSliderField from '../SessionPageSliderField.svelte';
  import { SessionPageMode, SessionPageSliderColorMode } from '../sessionPageTypes';
  import { updateRsm } from './exerciseCardUtils';

  let {
    sessionExercise,
    immediateFieldState,
    lateFieldState,
    mode
  }: {
    sessionExercise: WorkoutSessionExercise;
    immediateFieldState: { disabled: boolean; highlight: boolean };
    lateFieldState: { disabled: boolean; highlight: boolean };
    mode: SessionPageMode;
  } = $props();
</script>

<div class="flex flex-col gap-3">
  <div class="flex items-center gap-2">
    <h3 class="text-sm font-medium">Raw Stimulus Magnitude</h3>
    <InfoPopover>
      RSM measures the amount of muscle growth stimulus from this exercise. It is the sum of
      mind-muscle connection, pump, and disruption (0-9). Higher RSM means more growth stimulus.
    </InfoPopover>
  </div>

  <SessionPageSliderField
    label="Mind-Muscle Connection"
    value={sessionExercise.rsm?.mindMuscleConnection ?? null}
    descriptions={sharedTextConstants.mindMuscleDescriptions}
    colorMode={SessionPageSliderColorMode.Positive}
    disabled={immediateFieldState.disabled}
    highlight={immediateFieldState.highlight}
    onValueChange={(v) => updateRsm(sessionExercise._id, 'mindMuscleConnection', v)}
  />

  <SessionPageSliderField
    label="Pump"
    value={sessionExercise.rsm?.pump ?? null}
    descriptions={sharedTextConstants.pumpDescriptions}
    colorMode={SessionPageSliderColorMode.Positive}
    disabled={immediateFieldState.disabled}
    highlight={immediateFieldState.highlight}
    onValueChange={(v) => updateRsm(sessionExercise._id, 'pump', v)}
  />

  {#if mode === SessionPageMode.Active}
    <SessionPageDeferredField
      label="Disruption"
      reason="requires assessing soreness and recovery the following day"
    />
  {:else}
    <SessionPageSliderField
      label="Disruption"
      value={sessionExercise.rsm?.disruption ?? null}
      descriptions={sharedTextConstants.disruptionDescriptions}
      colorMode={SessionPageSliderColorMode.Positive}
      disabled={lateFieldState.disabled}
      highlight={lateFieldState.highlight}
      onValueChange={(v) => updateRsm(sessionExercise._id, 'disruption', v)}
    />
  {/if}
</div>
