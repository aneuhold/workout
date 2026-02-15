<!--
  @component

  Root component for the session page.
  Fetches session data, derives mode, manages card expansion, and orchestrates all sub-components.
-->
<script lang="ts">
  import type { WorkoutSet } from '@aneuhold/core-ts-db-lib';
  import sessionExerciseMapService from '$services/documentMapServices/sessionExerciseMapService.svelte';
  import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';
  import setMapService from '$services/documentMapServices/setMapService.svelte';
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

  let session = $derived(
    sessionId ? sessionMapService.getDocs().find((s) => s._id === sessionId) : undefined
  );

  let sessionExercises = $derived.by(() => {
    if (!session) return [];
    const allExercises = sessionExerciseMapService
      .getDocs()
      .filter((se) => se.workoutSessionId === session._id);
    return session.sessionExerciseOrder
      .map((id) => allExercises.find((se) => se._id === id))
      .filter((se) => se != null);
  });

  let allSets = $derived.by(() => {
    const setIds = sessionExercises.flatMap((se) => se.setOrder);
    return setIds.map((id) => setMapService.getDoc(id)).filter((s): s is WorkoutSet => s != null);
  });

  let completedSets = $derived(
    allSets.filter((s) => s.actualReps != null && s.actualWeight != null && s.rir != null)
  );

  let totalSets = $derived(allSets.length);
  let completedCount = $derived(completedSets.length);
  let percent = $derived(totalSets > 0 ? Math.round((completedCount / totalSets) * 100) : 0);

  // --- Mode derivation ---

  let mode: SessionPageMode = $derived.by(() => {
    if (!session) return SessionPageMode.Active;
    if (!session.complete) return SessionPageMode.Active;

    // Check if any late fields are still null
    const hasNullLateFields = sessionExercises.some((se) => {
      const disruptionNull = se.rsm?.disruption == null;
      const unusedMuscleNull = se.fatigue?.unusedMusclePerformance == null;
      const sorenessNull = se.sorenessScore == null;
      return disruptionNull || unusedMuscleNull || sorenessNull;
    });

    return hasNullLateFields ? SessionPageMode.Review : SessionPageMode.View;
  });

  // --- Current exercise index ---

  let currentExerciseIndex = $derived.by(() => {
    for (let i = 0; i < sessionExercises.length; i++) {
      const se = sessionExercises[i];
      const exerciseSets = se.setOrder
        .map((id) => setMapService.getDoc(id))
        .filter((s): s is WorkoutSet => s != null);
      const allComplete = exerciseSets.every(
        (s) => s.actualReps != null && s.actualWeight != null && s.rir != null
      );
      if (!allComplete) return i;
    }
    return sessionExercises.length - 1;
  });

  // --- Card state ---

  function getCardState(index: number): SessionPageExerciseCardState {
    if (mode !== SessionPageMode.Active) return SessionPageExerciseCardState.Completed;
    if (index < currentExerciseIndex) return SessionPageExerciseCardState.Completed;
    if (index === currentExerciseIndex) return SessionPageExerciseCardState.Current;
    return SessionPageExerciseCardState.Future;
  }

  // --- Expand state ---

  let expandedMap = $state<Record<string, boolean | undefined>>({});

  $effect(() => {
    const exercises = sessionExercises;
    const idx = currentExerciseIndex;
    if (exercises.length > 0 && exercises[idx]) {
      const currentId = exercises[idx]._id;
      if (expandedMap[currentId] === undefined) {
        expandedMap[currentId] = true;
      }
    }
  });

  function isExpanded(id: string): boolean {
    return expandedMap[id] ?? false;
  }

  function toggleExpanded(id: string) {
    expandedMap[id] = !isExpanded(id);
  }

  // --- Complete session ---

  function handleCompleteSession() {
    if (!session) return;
    sessionMapService.updateDoc(session._id, (doc) => {
      doc.complete = true;
      doc.lastUpdatedDate = new Date();
      return doc;
    });
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
      onComplete={handleCompleteSession}
    />
  {/if}
</div>
