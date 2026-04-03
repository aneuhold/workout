<!--
  @component

  Fatigue slider section for an exercise card.
  Contains Perceived Effort (deferred/late), Unused Muscle Performance (immediate),
  and Joint & Tissue Disruption (deferred/late) sliders.
-->
<script lang="ts">
  import type { WorkoutSessionExercise } from '@aneuhold/core-ts-db-lib';
  import InfoPopover from '$components/InfoPopover/InfoPopover.svelte';
  import sharedTextConstants from '$util/sharedTextConstants';
  import SessionPageDeferredField from '../SessionPageDeferredField.svelte';
  import SessionPageSliderField from '../SessionPageSliderField.svelte';
  import { SessionPageMode, SessionPageSliderColorMode } from '../sessionPageTypes';
  import { updateFatigue } from './exerciseCardUtils';

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
    <h3 class="text-sm font-medium">Fatigue</h3>
    <InfoPopover>
      Fatigue measures the cost of the stimulus. The Stimulus to Fatigue Ratio (SFR) is calculated
      as RSM / total fatigue. A higher SFR means more efficient stimulus.
    </InfoPopover>
  </div>

  {#if mode === SessionPageMode.Active}
    <SessionPageDeferredField
      label="Perceived Effort"
      reason="requires assessing recovery and energy levels over the following days"
    />
  {:else}
    <SessionPageSliderField
      label="Perceived Effort"
      value={sessionExercise.fatigue?.perceivedEffort ?? null}
      descriptions={sharedTextConstants.effortDescriptions}
      colorMode={SessionPageSliderColorMode.Negative}
      disabled={lateFieldState.disabled}
      highlight={lateFieldState.highlight}
      onValueChange={(v) => updateFatigue(sessionExercise._id, 'perceivedEffort', v)}
    />
  {/if}

  <SessionPageSliderField
    label="Unused Muscle Performance"
    value={sessionExercise.fatigue?.unusedMusclePerformance ?? null}
    descriptions={sharedTextConstants.unusedMuscleDescriptions}
    colorMode={SessionPageSliderColorMode.Negative}
    disabled={immediateFieldState.disabled}
    highlight={immediateFieldState.highlight}
    onValueChange={(v) => updateFatigue(sessionExercise._id, 'unusedMusclePerformance', v)}
  />

  {#if mode === SessionPageMode.Active}
    <SessionPageDeferredField
      label="Joint & Tissue Disruption"
      reason="requires assessing joint stress and connective tissue response after the session"
    />
  {:else}
    <SessionPageSliderField
      label="Joint & Tissue Disruption"
      value={sessionExercise.fatigue?.jointAndTissueDisruption ?? null}
      descriptions={sharedTextConstants.jointDescriptions}
      colorMode={SessionPageSliderColorMode.Negative}
      disabled={lateFieldState.disabled}
      highlight={lateFieldState.highlight}
      onValueChange={(v) => updateFatigue(sessionExercise._id, 'jointAndTissueDisruption', v)}
    />
  {/if}
</div>
