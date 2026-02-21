<!--
  @component

  Root component for the session page.
  Fetches session data, derives mode, manages card expansion, and orchestrates all sub-components.
-->
<script lang="ts">
  import { WorkoutSessionExerciseService, WorkoutSetService } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import { goto } from '$app/navigation';
  import sessionExerciseMapService from '$services/documentMapServices/sessionExerciseMapService.svelte';
  import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';
  import SessionPageExerciseCard from './SessionPageExerciseCard.svelte';
  import SessionPageHeader from './SessionPageHeader.svelte';
  import SessionPageProgressBar from './SessionPageProgressBar.svelte';
  import SessionPageSummaryCard from './SessionPageSummaryCard.svelte';
  import { SessionPageExerciseCardState, SessionPageMode } from './sessionPageTypes';

  let {
    sessionId
  }: {
    sessionId: string | null;
  } = $props();

  // --- Data ---

  let session = $derived(sessionId ? sessionMapService.getDoc(sessionId as UUID) : undefined);

  let sessionExercises = $derived(
    session ? sessionMapService.getOrderedSessionExercisesForSession(session) : []
  );

  let allSets = $derived(session ? sessionMapService.getOrderedSetsForSession(session) : []);

  let completedSets = $derived(allSets.filter((s) => WorkoutSetService.isCompleted(s)));

  let totalSets = $derived(allSets.length);
  let completedCount = $derived(completedSets.length);
  let percent = $derived(totalSets > 0 ? Math.round((completedCount / totalSets) * 100) : 0);

  let allImmediateSlidersFilled = $derived(
    sessionExercises.every((se) => {
      const seSets = sessionExerciseMapService.getOrderedSetsForSessionExercise(se);
      return WorkoutSessionExerciseService.hasMidSessionMetricsFilled(se, seSets);
    })
  );

  // --- Mode derivation ---

  let dataMode: SessionPageMode = $derived.by(() => {
    if (!session) return SessionPageMode.Active;
    if (!session.complete) return SessionPageMode.Active;

    const hasUnfilledMetrics = sessionExercises.some((se) => {
      const seSets = sessionExerciseMapService.getOrderedSetsForSessionExercise(se);
      return !WorkoutSessionExerciseService.hasAllSessionMetricsFilled(se, seSets);
    });

    return hasUnfilledMetrics ? SessionPageMode.Review : SessionPageMode.View;
  });

  // Keep the user in review mode until they explicitly confirm, even after
  // all late fields are filled. This prevents the jarring instant lock, which can prevent them
  // from filling the late fields correctly.
  let wasInReviewMode = $state(false);
  let reviewConfirmed = $state(false);

  $effect(() => {
    if (dataMode === SessionPageMode.Review) {
      wasInReviewMode = true;
    }
  });

  let mode: SessionPageMode = $derived.by(() => {
    if (dataMode === SessionPageMode.Active) return SessionPageMode.Active;
    if (wasInReviewMode && !reviewConfirmed) return SessionPageMode.Review;
    return dataMode;
  });

  let allLateFieldsFilled = $derived(
    sessionExercises.length > 0 &&
      sessionExercises.every((se) => exerciseHasAllSessionMetricsFilled(se))
  );

  /**
   * Current exercise index is the index of the first session exercise that has an incomplete set, or
   * the length of the session exercises array if all are complete. In review mode, it is the
   * index of the first session exercise that has null late fields.
   * In view mode, all exercises are considered complete.
   */
  let currentExerciseIndex = $derived.by(() => {
    for (let i = 0; i < sessionExercises.length; i++) {
      const exerciseSets = sessionExerciseMapService.getOrderedSetsForSessionExercise(
        sessionExercises[i]
      );
      const allComplete = exerciseSets.every((s) => WorkoutSetService.isCompleted(s));
      if (!allComplete) return i;
    }
    return sessionExercises.length;
  });

  // --- Card state ---

  function exerciseHasAllSessionMetricsFilled(se: (typeof sessionExercises)[number]): boolean {
    const seSets = sessionExerciseMapService.getOrderedSetsForSessionExercise(se);
    return WorkoutSessionExerciseService.hasAllSessionMetricsFilled(se, seSets);
  }

  function getCardState(index: number): SessionPageExerciseCardState {
    if (mode === SessionPageMode.Review) {
      return exerciseHasAllSessionMetricsFilled(sessionExercises[index])
        ? SessionPageExerciseCardState.Completed
        : SessionPageExerciseCardState.Current;
    }
    if (mode === SessionPageMode.View) return SessionPageExerciseCardState.Completed;
    if (index < currentExerciseIndex) return SessionPageExerciseCardState.Completed;
    if (index === currentExerciseIndex) return SessionPageExerciseCardState.Current;
    return SessionPageExerciseCardState.Future;
  }

  // --- Expand state ---

  let expandedMap = $state<Record<string, boolean | undefined>>({});

  $effect(() => {
    const exercises = sessionExercises;
    if (mode === SessionPageMode.Review) {
      for (const se of exercises) {
        if (!exerciseHasAllSessionMetricsFilled(se) && expandedMap[se._id] === undefined) {
          expandedMap[se._id] = true;
        }
      }
    } else {
      const idx = currentExerciseIndex;
      if (exercises.length > 0 && exercises[idx]) {
        const currentId = exercises[idx]._id;
        if (expandedMap[currentId] === undefined) {
          expandedMap[currentId] = true;
        }
      }
    }
  });

  function isExpanded(id: string): boolean {
    return expandedMap[id] ?? false;
  }

  function toggleExpanded(id: string) {
    expandedMap[id] = !isExpanded(id);
  }

  // --- Complete session / review ---

  function handleCompleteSession() {
    if (!session) return;
    sessionMapService.updateDoc(session._id, (doc) => {
      doc.complete = true;
      doc.lastUpdatedDate = new Date();
      return doc;
    });
    goto(`/sessions`);
  }

  function handleCompleteReview() {
    reviewConfirmed = true;
  }
</script>

<div class="flex flex-col gap-4 p-4">
  {#if !session}
    <SessionPageHeader title="Session" />
    <p class="text-sm text-muted-foreground">Session not found.</p>
  {:else}
    <SessionPageHeader title={session.title} description={session.description} />

    <SessionPageProgressBar completed={completedCount} total={totalSets} />

    {#each sessionExercises as se, i (se._id)}
      <SessionPageExerciseCard
        sessionExercise={se}
        cardState={getCardState(i)}
        {mode}
        expanded={isExpanded(se._id)}
        onToggle={() => toggleExpanded(se._id)}
      />
    {/each}

    <SessionPageSummaryCard
      completed={completedCount}
      total={totalSets}
      {percent}
      {mode}
      {allImmediateSlidersFilled}
      {allLateFieldsFilled}
      onComplete={handleCompleteSession}
      onCompleteReview={handleCompleteReview}
    />
  {/if}
</div>
