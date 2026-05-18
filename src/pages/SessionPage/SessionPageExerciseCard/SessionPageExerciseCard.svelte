<!--
  @component

  Orchestrator for a single exercise card within a session.
  Derives per-exercise data and renders sub-components for each section of the card.
-->
<script lang="ts">
  import {
    WorkoutExerciseService,
    type WorkoutSessionExercise,
    WorkoutSessionExerciseService,
    type WorkoutSet,
    WorkoutSetService
  } from '@aneuhold/core-ts-db-lib';
  import { IconExternalLink } from '@tabler/icons-svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import sessionExerciseMapService from '$services/documentMapServices/sessionExerciseMapService.svelte';
  import setMapService from '$services/documentMapServices/setMapService.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Separator from '$ui/Separator/Separator.svelte';
  import { cn } from '$util/svelte-shadcn-util';
  import sessionPageService from '../SessionPageService.svelte';
  import { SessionPageExerciseCardState, SessionPageMode } from '../sessionPageTypes';
  import { getImmediateFieldState, getLateFieldState } from './exerciseCardUtils';
  import SessionPageExerciseCardFatigueSliders from './SessionPageExerciseCardFatigueSliders.svelte';
  import SessionPageExerciseCardFreeFormActions from './SessionPageExerciseCardFreeFormActions.svelte';
  import SessionPageExerciseCardHeader from './SessionPageExerciseCardHeader.svelte';
  import SessionPageExerciseCardPrevSoreness from './SessionPageExerciseCardPrevSoreness.svelte';
  import SessionPageExerciseCardRecovery from './SessionPageExerciseCardRecovery.svelte';
  import SessionPageExerciseCardRestTimer from './SessionPageExerciseCardRestTimer.svelte';
  import SessionPageExerciseCardRsmSliders from './SessionPageExerciseCardRsmSliders.svelte';
  import SessionPageExerciseCardSetTable from './SessionPageExerciseCardSetTable.svelte';

  let {
    sessionExercise,
    index
  }: {
    sessionExercise: WorkoutSessionExercise;
    index: number;
  } = $props();

  // --- Per-exercise derived state ---

  let exercise = $derived(exerciseMapService.getDoc(sessionExercise.workoutExerciseId));
  let exerciseCTO = $derived(exerciseMapService.getCTO(sessionExercise.workoutExerciseId));
  let sets = $derived(
    sessionExercise.setOrder
      .map((id) => setMapService.getDoc(id))
      .filter((s): s is WorkoutSet => s != null)
  );
  let isDeload = $derived(WorkoutSessionExerciseService.isDeloadExercise(sets));
  let hasRirAndReps = $derived(sets.some((s) => s.plannedReps != null && s.plannedRir != null));
  let computedPerformanceScore = $derived(WorkoutSessionExerciseService.getPerformanceScore(sets));
  let repRange = $derived(
    exercise ? WorkoutExerciseService.getRepRangeValues(exercise.repRange) : null
  );
  let allExerciseSetsLogged = $derived(
    sets.length > 0 && sets.every((s) => WorkoutSetService.isCompleted(s))
  );

  // --- Service-derived state for this exercise ---

  let mode = $derived(sessionPageService.mode);
  let isFreeForm = $derived(sessionPageService.isFreeForm);
  let bestSets = $derived.by((): WorkoutSet[] => {
    if (!isFreeForm || !exerciseCTO?.bestSet) return [];
    const se = sessionExerciseMapService.getDoc(exerciseCTO.bestSet.workoutSessionExerciseId);
    if (!se) return [];
    return sessionExerciseMapService.getOrderedSetsForSessionExercise(se);
  });
  let lastSets = $derived(isFreeForm ? (exerciseCTO?.lastSessionSets ?? []) : []);
  let allSetsLogged = $derived(sessionPageService.allSetsLogged);
  let cardState = $derived(sessionPageService.getCardState(index));
  let expanded = $derived(sessionPageService.isExpanded(sessionExercise._id));
  let exerciseDone = $derived(sessionPageService.isExerciseDone(sessionExercise._id));
  let previousSessionExercise = $derived(
    sessionPageService.previousSessionExerciseMap.get(sessionExercise.workoutExerciseId)
  );
  let sorenessLocked = $derived(
    sessionPageService.sorenessLockedExerciseIds.has(sessionExercise.workoutExerciseId)
  );
  let freeFormEditable = $derived(isFreeForm && !exerciseDone);

  let immediateFieldState = $derived(getImmediateFieldState(mode, allSetsLogged));
  let lateFieldState = $derived(getLateFieldState(mode));

  let showRestTimer = $derived(
    mode === SessionPageMode.Active &&
      (cardState === SessionPageExerciseCardState.Current ||
        sets.some((s) => !WorkoutSetService.isCompleted(s)))
  );

  // --- Set logging handlers ---

  function handleLogSet(set: WorkoutSet, weight: number, reps: number, rir: number | null) {
    setMapService.updateDoc(set._id, (doc) => {
      doc.actualWeight = weight;
      doc.actualReps = reps;
      doc.rir = rir;
      return doc;
    });
  }

  function handlePlannedChange(
    set: WorkoutSet,
    weight: number | undefined,
    reps: number | undefined
  ) {
    setMapService.updateDoc(set._id, (doc) => {
      doc.plannedWeight = weight ?? null;
      doc.plannedReps = reps ?? null;
      return doc;
    });
  }

  // Auto-sync computed performance score to the document
  $effect(() => {
    if (mode === SessionPageMode.Planning) return;
    const score = computedPerformanceScore;
    if (score !== null && score !== sessionExercise.performanceScore) {
      sessionExerciseMapService.updateDoc(sessionExercise._id, (doc) => {
        doc.performanceScore = score;
        return doc;
      });
    }
  });

  // --- Card styling ---

  let cardClass = $derived(
    cardState === SessionPageExerciseCardState.Completed
      ? mode === SessionPageMode.Review
        ? ''
        : 'opacity-60'
      : cardState === SessionPageExerciseCardState.Current
        ? 'ring-2 ring-primary'
        : ''
  );
</script>

<div
  class="bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl text-sm ring-1 ring-foreground/10 {cardClass}"
>
  <SessionPageExerciseCardHeader
    {exercise}
    {sessionExercise}
    {expanded}
    {cardState}
    {repRange}
    onToggle={() => sessionPageService.toggleExpanded(sessionExercise._id)}
  />

  <div
    class={cn(
      'grid transition-[grid-template-rows] duration-200 ease-out',
      expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
    )}
  >
    <div class="overflow-hidden">
      <Separator />
      <div class="flex flex-col gap-4 px-3 py-3">
        {#if exercise}
          <Button
            href="/exercise?exerciseId={exercise._id}"
            variant="ghost"
            size="sm"
            class="self-start text-muted-foreground hover:text-foreground"
          >
            <IconExternalLink size={14} />
            View exercise details
          </Button>
        {/if}

        {#if mode === SessionPageMode.Active && previousSessionExercise && !sets.some( (s) => WorkoutSetService.isCompleted(s) )}
          <SessionPageExerciseCardPrevSoreness {previousSessionExercise} />
        {/if}

        <SessionPageExerciseCardSetTable
          {sets}
          {hasRirAndReps}
          {isDeload}
          {mode}
          {freeFormEditable}
          {bestSets}
          {lastSets}
          onAddSet={() => sessionExerciseMapService.addSetToExercise(sessionExercise._id)}
          onRemoveSet={(setId) =>
            sessionExerciseMapService.removeSetFromExercise(sessionExercise._id, setId)}
          onLogSet={handleLogSet}
          onEditSet={handleLogSet}
          onPlannedChange={handlePlannedChange}
        />

        {#if showRestTimer}
          <Separator />
          <SessionPageExerciseCardRestTimer {exercise} />
        {/if}

        {#if isFreeForm && (mode === SessionPageMode.Active || mode === SessionPageMode.Planning)}
          <Separator />
          <SessionPageExerciseCardFreeFormActions
            {exercise}
            {exerciseDone}
            {allExerciseSetsLogged}
            {mode}
            {freeFormEditable}
            onDone={() => sessionPageService.handleDoneExercise(sessionExercise._id)}
            onEdit={() => sessionPageService.handleEditExercise(sessionExercise._id)}
            onRemoveExercise={() => sessionPageService.handleRemoveExercise(sessionExercise._id)}
          />
        {/if}

        {#if !isDeload && mode !== SessionPageMode.Planning}
          <Separator />
          <SessionPageExerciseCardRsmSliders
            {sessionExercise}
            {immediateFieldState}
            {lateFieldState}
            {mode}
          />

          <Separator />
          <SessionPageExerciseCardFatigueSliders
            {sessionExercise}
            {immediateFieldState}
            {lateFieldState}
            {mode}
          />

          <Separator />
          <SessionPageExerciseCardRecovery {sessionExercise} {mode} {sorenessLocked} />
        {/if}
      </div>
    </div>
  </div>
</div>
