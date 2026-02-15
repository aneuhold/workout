<!--
  @component

  Collapsible card for a single exercise within a session.
  Contains set table, rest timer, RSM sliders, fatigue sliders, and recovery fields.
-->
<script lang="ts">
  import {
    WorkoutExerciseService,
    type WorkoutSessionExercise,
    type WorkoutSet
  } from '@aneuhold/core-ts-db-lib';
  import {
    IconCheck,
    IconChevronDown,
    IconChevronUp,
    IconPlayerPause,
    IconPlayerPlay,
    IconPlayerStop,
    IconStopwatch
  } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import { goto } from '$app/navigation';
  import InfoPopover from '$components/InfoPopover/InfoPopover.svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import sessionExerciseMapService from '$services/documentMapServices/sessionExerciseMapService.svelte';
  import setMapService from '$services/documentMapServices/setMapService.svelte';
  import timerService from '$services/TimerService';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Separator from '$ui/Separator/Separator.svelte';
  import { formatTime } from '$util/formatTime';
  import SessionPageDeferredField from './SessionPageDeferredField.svelte';
  import SessionPageSetRow from './SessionPageSetRow.svelte';
  import SessionPageSliderField from './SessionPageSliderField.svelte';
  import {
    SessionPageExerciseCardState,
    SessionPageMode,
    SessionPageSetState,
    SessionPageSliderColorMode
  } from './sessionPageTypes';

  let {
    sessionExercise,
    cardState,
    mode,
    expanded,
    onToggle
  }: {
    sessionExercise: WorkoutSessionExercise;
    cardState: SessionPageExerciseCardState;
    mode: SessionPageMode;
    expanded: boolean;
    onToggle: () => void;
  } = $props();

  // --- Data lookups ---

  let exercise = $derived(exerciseMapService.getDoc(sessionExercise.workoutExerciseId));

  let sets = $derived(
    sessionExercise.setOrder
      .map((id) => setMapService.getDoc(id))
      .filter((s): s is WorkoutSet => s != null)
  );

  let repRange = $derived(
    exercise ? WorkoutExerciseService.getRepRangeValues(exercise.repRange) : null
  );

  // --- Muscle group names ---

  function getMuscleGroupName(id: UUID): string {
    return muscleGroupMapService.getDoc(id)?.name ?? 'Unknown';
  }

  let primaryMuscleNames = $derived(
    exercise ? exercise.primaryMuscleGroups.map(getMuscleGroupName).join(', ') : ''
  );

  let secondaryMuscleNames = $derived(
    exercise ? exercise.secondaryMuscleGroups.map(getMuscleGroupName).join(', ') : ''
  );

  // --- Set states ---

  function getSetState(set: WorkoutSet, index: number): SessionPageSetState {
    if (set.actualReps != null && set.actualWeight != null && set.rir != null) {
      return SessionPageSetState.Completed;
    }
    const firstIncomplete = sets.findIndex(
      (s) => s.actualReps == null || s.actualWeight == null || s.rir == null
    );
    return index === firstIncomplete ? SessionPageSetState.Current : SessionPageSetState.Future;
  }

  // --- Set logging ---

  function handleLogSet(set: WorkoutSet, weight: number, reps: number, rir: number) {
    setMapService.updateDoc(set._id, (doc) => {
      doc.actualWeight = weight;
      doc.actualReps = reps;
      doc.rir = rir;
      doc.lastUpdatedDate = new Date();
      return doc;
    });
  }

  // --- Rest timer ---

  function handleStartTimer() {
    const seconds = exercise?.restSeconds ?? 180;
    timerService.start(seconds);
  }

  let showRestTimer = $derived(
    mode === SessionPageMode.Active &&
      (cardState === SessionPageExerciseCardState.Current ||
        sets.some((s) => s.actualReps == null || s.actualWeight == null || s.rir == null))
  );

  // --- Slider descriptions ---

  const mindMuscleDescriptions = [
    'You felt barely aware of your target muscles during the exercise',
    'You felt like your target muscles worked, but mildly',
    'You felt a good amount of tension and/or burn in the target muscles',
    'You felt tension and burn close to the limit in your target muscles'
  ];

  const pumpDescriptions = [
    'You got no pump at all in the target muscles',
    'You got a very mild pump in the target muscles',
    'You got a decent pump in the target muscles',
    'You got close to maximal pump in the target muscles'
  ];

  const disruptionDescriptions = [
    'You had no fatigue, perturbation, or soreness in the target muscles',
    'You had some weakness and stiffness after the session but recovered by the next day',
    'You had weakness and stiffness after the session and experienced soreness the following day',
    'You got much weaker and felt perturbation right after the session and had soreness for days or more'
  ];

  const jointDescriptions = [
    'You had minimal to no pain or perturbation in your joints or connective tissues',
    'You had some pain or perturbation in your joints and connective tissues but recovered by the next day',
    'You had some persistent pain or tightness in your connective tissues that lasted through the following day or several days',
    'You develop chronic pain in the joints and connective tissues that persists across days to weeks or longer'
  ];

  const effortDescriptions = [
    'Training felt very easy and hardly taxed you psychologically',
    'You put effort into the training, but felt recovered by the end of the day',
    'You put a large effort into the training and felt drained through the next day',
    'You put an all-out effort into the training and felt drained for days'
  ];

  const unusedMuscleDescriptions = [
    'Performance on subsequent exercises targeting unused muscles was better than expected',
    'Performance on subsequent exercises targeting unused muscles was as expected',
    'Performance on subsequent exercises targeting unused muscles was worse than expected',
    'Your performance on subsequent exercises targeting unused muscles was hugely deteriorated'
  ];

  const performanceDescriptions = [
    'You hit your target reps, but had to do 2+ more reps than planned to hit target RIR, or hit target reps at 2+ reps before target RIR',
    'You hit your target reps, but had to do 0-1 more reps than planned to hit target RIR, or hit target reps at 1 rep before target RIR',
    'You hit your target reps after your target RIR',
    "You could not match last week's reps at any RIR"
  ];

  const sorenessDescriptions = [
    'You did not get at all sore in the target muscles',
    'You got stiff for a few hours after training and had mild soreness that resolved by next session',
    'You got DOMS that resolved just in time for the next session',
    'You got DOMS that remained for the next session'
  ];

  // --- Slider interaction states ---

  /**
   * Returns whether a slider is disabled and highlighted based on field type and mode.
   * Immediate fields: interactive in active, read-only in review/view
   * Late fields: deferred in active, interactive+highlighted in review, read-only in view
   */
  function getImmediateFieldState(): { disabled: boolean; highlight: boolean } {
    return { disabled: mode !== SessionPageMode.Active, highlight: false };
  }

  function getLateFieldState(): { disabled: boolean; highlight: boolean } {
    if (mode === SessionPageMode.Review) return { disabled: false, highlight: true };
    return { disabled: true, highlight: false };
  }

  // --- Slider change handlers ---

  function updateRsm(field: 'mindMuscleConnection' | 'pump' | 'disruption', value: number | null) {
    sessionExerciseMapService.updateDoc(sessionExercise._id, (doc) => {
      if (!doc.rsm) {
        doc.rsm = { mindMuscleConnection: null, pump: null, disruption: null };
      }
      doc.rsm[field] = value;
      doc.lastUpdatedDate = new Date();
      return doc;
    });
  }

  function updateFatigue(
    field: 'jointAndTissueDisruption' | 'perceivedEffort' | 'unusedMusclePerformance',
    value: number | null
  ) {
    sessionExerciseMapService.updateDoc(sessionExercise._id, (doc) => {
      if (!doc.fatigue) {
        doc.fatigue = {
          jointAndTissueDisruption: null,
          perceivedEffort: null,
          unusedMusclePerformance: null
        };
      }
      doc.fatigue[field] = value;
      doc.lastUpdatedDate = new Date();
      return doc;
    });
  }

  function updatePerformance(value: number | null) {
    sessionExerciseMapService.updateDoc(sessionExercise._id, (doc) => {
      doc.performanceScore = value;
      doc.lastUpdatedDate = new Date();
      return doc;
    });
  }

  function updateSoreness(value: number | null) {
    sessionExerciseMapService.updateDoc(sessionExercise._id, (doc) => {
      doc.sorenessScore = value;
      doc.lastUpdatedDate = new Date();
      return doc;
    });
  }

  // --- Card styling ---

  let cardClass = $derived(
    cardState === SessionPageExerciseCardState.Completed
      ? 'opacity-60'
      : cardState === SessionPageExerciseCardState.Current
        ? 'ring-2 ring-primary'
        : ''
  );
</script>

<div
  class="bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl text-sm ring-1 ring-foreground/10 {cardClass}"
>
  <!-- Header -->
  <button
    class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
    onclick={onToggle}
  >
    <!-- Status icon -->
    <div class="flex w-4 shrink-0 items-center justify-center">
      {#if cardState === SessionPageExerciseCardState.Completed}
        <IconCheck size={16} class="text-green-600" />
      {:else if cardState === SessionPageExerciseCardState.Current}
        <span class="relative flex h-2.5 w-2.5">
          <span
            class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
          ></span>
          <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
        </span>
      {/if}
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <span class="font-medium">{exercise?.exerciseName ?? 'Unknown Exercise'}</span>
      <div class="flex flex-wrap gap-1">
        {#if repRange && exercise}
          <Badge variant="outline">
            {repRange.min}-{repRange.max} reps ({exercise.repRange})
          </Badge>
        {/if}
        {#if exercise}
          {#each exercise.primaryMuscleGroups as muscleGroupId (muscleGroupId)}
            <Badge variant="secondary">{getMuscleGroupName(muscleGroupId)}</Badge>
          {/each}
        {/if}
      </div>
    </div>

    {#if expanded}
      <IconChevronUp size={16} class="shrink-0 text-muted-foreground" />
    {:else}
      <IconChevronDown size={16} class="shrink-0 text-muted-foreground" />
    {/if}
  </button>

  {#if expanded}
    <Separator />
    <div class="flex flex-col gap-4 px-3 py-3">
      <!-- Section 1: Set Table -->
      <div class="flex flex-col gap-1">
        <div class="grid grid-cols-12 items-center gap-1.5 px-2 text-xs text-muted-foreground">
          <div class="col-span-1">#</div>
          <div class="col-span-3">Weight</div>
          <div class="col-span-3">Reps</div>
          <div class="col-span-2">RIR</div>
          <div class="col-span-3"></div>
        </div>
        {#each sets as set, i (set._id)}
          <SessionPageSetRow
            {set}
            setNumber={i + 1}
            setState={getSetState(set, i)}
            {mode}
            onLog={(weight, reps, rir) => handleLogSet(set, weight, reps, rir)}
          />
        {/each}
      </div>

      <!-- Section 2: Rest Timer -->
      {#if showRestTimer}
        <Separator />
        <div class="flex items-center gap-2">
          {#if timerService.isActive}
            <Button
              size="sm"
              class={timerService.isPaused ? '' : 'animate-timer-pulse'}
              onclick={() => goto('/timer')}
            >
              <IconStopwatch size={14} />
              {formatTime(timerService.remainingSeconds)}
            </Button>
            {#if timerService.isPaused}
              <Button variant="outline" size="icon-sm" onclick={() => timerService.resume()}>
                <IconPlayerPlay size={14} />
              </Button>
            {:else}
              <Button variant="outline" size="icon-sm" onclick={() => timerService.pause()}>
                <IconPlayerPause size={14} />
              </Button>
            {/if}
            <Button variant="outline" size="icon-sm" onclick={() => timerService.stop()}>
              <IconPlayerStop size={14} />
            </Button>
          {:else}
            <Button variant="outline" size="sm" onclick={handleStartTimer}>
              <IconStopwatch size={14} />
              Start Rest Timer
            </Button>
          {/if}
          <InfoPopover>
            <p class="mb-2 font-medium">Rest Readiness Guidelines</p>
            <ul class="flex flex-col gap-1.5 text-sm">
              <li>
                Are my <strong>{primaryMuscleNames}</strong> still burning from the last set?
              </li>
              {#if secondaryMuscleNames}
                <li>
                  Are my <strong>{secondaryMuscleNames}</strong> ready to support my
                  <strong>{primaryMuscleNames}</strong> in another set?
                </li>
              {/if}
              <li>
                Do I feel mentally and physically like I can push hard with my
                <strong>{primaryMuscleNames}</strong> again?
              </li>
              <li>Is my breathing more or less back to normal?</li>
            </ul>
            <p class="mt-2 text-xs text-muted-foreground">
              If you can answer yes to all of these, you are ready for the next set.
            </p>
          </InfoPopover>
        </div>
      {/if}

      <!-- Section 3: RSM Sliders -->
      <Separator />
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-medium">Raw Stimulus Magnitude</h3>
          <InfoPopover>
            RSM measures the amount of muscle growth stimulus from this exercise. It is the sum of
            mind-muscle connection, pump, and disruption (0-9). Higher RSM means more growth
            stimulus.
          </InfoPopover>
        </div>

        <SessionPageSliderField
          label="Mind-Muscle Connection"
          value={sessionExercise.rsm?.mindMuscleConnection ?? null}
          descriptions={mindMuscleDescriptions}
          colorMode={SessionPageSliderColorMode.Positive}
          disabled={getImmediateFieldState().disabled}
          highlight={getImmediateFieldState().highlight}
          onValueChange={(v) => updateRsm('mindMuscleConnection', v)}
        />

        <SessionPageSliderField
          label="Pump"
          value={sessionExercise.rsm?.pump ?? null}
          descriptions={pumpDescriptions}
          colorMode={SessionPageSliderColorMode.Positive}
          disabled={getImmediateFieldState().disabled}
          highlight={getImmediateFieldState().highlight}
          onValueChange={(v) => updateRsm('pump', v)}
        />

        {#if mode === SessionPageMode.Active}
          <SessionPageDeferredField label="Disruption" />
        {:else}
          <SessionPageSliderField
            label="Disruption"
            value={sessionExercise.rsm?.disruption ?? null}
            descriptions={disruptionDescriptions}
            colorMode={SessionPageSliderColorMode.Positive}
            disabled={getLateFieldState().disabled}
            highlight={getLateFieldState().highlight}
            onValueChange={(v) => updateRsm('disruption', v)}
          />
        {/if}
      </div>

      <!-- Section 4: Fatigue Sliders -->
      <Separator />
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-medium">Fatigue</h3>
          <InfoPopover>
            Fatigue measures the cost of the stimulus. The Stimulus to Fatigue Ratio (SFR) is
            calculated as RSM / total fatigue. A higher SFR means more efficient stimulus.
          </InfoPopover>
        </div>

        <SessionPageSliderField
          label="Joint & Tissue Disruption"
          value={sessionExercise.fatigue?.jointAndTissueDisruption ?? null}
          descriptions={jointDescriptions}
          colorMode={SessionPageSliderColorMode.Negative}
          disabled={getImmediateFieldState().disabled}
          highlight={getImmediateFieldState().highlight}
          onValueChange={(v) => updateFatigue('jointAndTissueDisruption', v)}
        />

        <SessionPageSliderField
          label="Perceived Effort"
          value={sessionExercise.fatigue?.perceivedEffort ?? null}
          descriptions={effortDescriptions}
          colorMode={SessionPageSliderColorMode.Negative}
          disabled={getImmediateFieldState().disabled}
          highlight={getImmediateFieldState().highlight}
          onValueChange={(v) => updateFatigue('perceivedEffort', v)}
        />

        {#if mode === SessionPageMode.Active}
          <SessionPageDeferredField label="Unused Muscle Performance" />
        {:else}
          <SessionPageSliderField
            label="Unused Muscle Performance"
            value={sessionExercise.fatigue?.unusedMusclePerformance ?? null}
            descriptions={unusedMuscleDescriptions}
            colorMode={SessionPageSliderColorMode.Negative}
            disabled={getLateFieldState().disabled}
            highlight={getLateFieldState().highlight}
            onValueChange={(v) => updateFatigue('unusedMusclePerformance', v)}
          />
        {/if}
      </div>

      <!-- Section 5: Recovery -->
      <Separator />
      <div class="flex flex-col gap-3">
        <h3 class="text-sm font-medium">Recovery</h3>

        <SessionPageSliderField
          label="Performance Score"
          value={sessionExercise.performanceScore ?? null}
          descriptions={performanceDescriptions}
          colorMode={SessionPageSliderColorMode.Performance}
          disabled={getImmediateFieldState().disabled}
          highlight={getImmediateFieldState().highlight}
          onValueChange={updatePerformance}
        />

        {#if mode === SessionPageMode.Active}
          <SessionPageDeferredField label="Soreness" />
        {:else}
          <SessionPageSliderField
            label="Soreness"
            value={sessionExercise.sorenessScore ?? null}
            descriptions={sorenessDescriptions}
            colorMode={SessionPageSliderColorMode.Negative}
            disabled={getLateFieldState().disabled}
            highlight={getLateFieldState().highlight}
            onValueChange={updateSoreness}
          />
        {/if}
      </div>
    </div>
  {/if}
</div>
