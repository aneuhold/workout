<!--
  @component

  Root component for the session page.
  Fetches session data, derives mode, manages card expansion, and orchestrates all sub-components.
-->
<script lang="ts">
  import {
    WorkoutMesocycleService,
    type WorkoutSessionExercise,
    WorkoutSessionExerciseService,
    WorkoutSessionLockReason,
    WorkoutSessionService,
    WorkoutSetService
  } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import { goto } from '$app/navigation';
  import { deloadDialog } from '$components/singletons/dialogs/SingletonDeloadDialog/SingletonDeloadDialog.svelte';
  import SingletonEditSetDialog from '$components/singletons/dialogs/SingletonEditSetDialog/SingletonEditSetDialog.svelte';
  import { exercisePickerDialog } from '$components/singletons/dialogs/SingletonExercisePickerDialog/SingletonExercisePickerDialog.svelte';
  import SingletonExercisePickerDialog from '$components/singletons/dialogs/SingletonExercisePickerDialog/SingletonExercisePickerDialog.svelte';
  import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
  import microcycleMapService from '$services/documentMapServices/microcycleMapService.svelte';
  import sessionExerciseMapService from '$services/documentMapServices/sessionExerciseMapService.svelte';
  import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';
  import Button from '$ui/Button/Button.svelte';
  import SessionPageExerciseCard from './SessionPageExerciseCard.svelte';
  import SessionPageHeader from './SessionPageHeader.svelte';
  import SessionPageProgressBar from './SessionPageProgressBar.svelte';
  import SessionPageSummaryCard from './SessionPageSummaryCard.svelte';
  import { SessionPageExerciseCardState, SessionPageMode } from './sessionPageTypes';

  let {
    sessionId,
    planning = false
  }: {
    sessionId: string | null;
    planning?: boolean;
  } = $props();

  let session = $derived(sessionId ? sessionMapService.getDoc(sessionId as UUID) : undefined);
  let isFreeForm = $derived(session ? sessionMapService.isFreeFormSession(session) : false);
  let sessionExercises = $derived(
    session ? sessionMapService.getOrderedSessionExercisesForSession(session) : []
  );
  let allSets = $derived(session ? sessionMapService.getOrderedSetsForSession(session) : []);
  let completedSets = $derived(allSets.filter((s) => WorkoutSetService.isCompleted(s)));
  let totalSets = $derived(allSets.length);
  let completedCount = $derived(completedSets.length);
  let percent = $derived(totalSets > 0 ? Math.round((completedCount / totalSets) * 100) : 0);
  let allSetsLogged = $derived(completedCount >= totalSets && totalSets > 0);
  let allImmediateSlidersFilled = $derived(
    sessionExercises.every((se) => {
      const seSets = sessionExerciseMapService.getOrderedSetsForSessionExercise(se);
      return WorkoutSessionExerciseService.hasMidSessionMetricsFilled(se, seSets);
    })
  );
  let microcycle = $derived(
    session?.workoutMicrocycleId
      ? microcycleMapService.getDoc(session.workoutMicrocycleId)
      : undefined
  );
  let mesocycle = $derived(
    microcycle?.workoutMesocycleId
      ? mesocycleMapService.getDoc(microcycle.workoutMesocycleId)
      : undefined
  );
  let previousMicrocycle = $derived.by(() => {
    if (!microcycle || !mesocycle) return undefined;
    const orderedMicrocycles = microcycleMapService.getOrderedMicrocyclesForMesocycle(
      mesocycle._id
    );
    const currentIndex = orderedMicrocycles.findIndex((mc) => mc._id === microcycle._id);
    return currentIndex > 0 ? orderedMicrocycles[currentIndex - 1] : undefined;
  });

  let previousSessionInMicrocycle = $derived.by(() => {
    if (!microcycle || !session) return undefined;
    const sessionIndex = microcycle.sessionOrder.indexOf(session._id);
    if (sessionIndex <= 0) return undefined;
    return sessionMapService.getDoc(microcycle.sessionOrder[sessionIndex - 1]);
  });

  let lockReason = $derived(
    WorkoutSessionService.getSessionLockReason(
      microcycle,
      mesocycle,
      previousMicrocycle,
      previousSessionInMicrocycle
    )
  );

  let dataMode: SessionPageMode = $derived.by(() => {
    if (planning) return SessionPageMode.Planning;
    if (!session) return SessionPageMode.Active;
    if (lockReason != null) return SessionPageMode.Locked;
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
    if (planning) return SessionPageMode.Planning;
    if (dataMode === SessionPageMode.Locked) return SessionPageMode.Locked;
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

  // --- Free-form Done state ---

  /** Per-exercise "Done" state (local, not persisted). */
  let doneExerciseIds = new SvelteSet<UUID>();

  /**
   * Whether the initial Done state has been derived from persisted data.
   * This runs once on page load — after that, only the explicit Done button
   * toggles the state (logging sets does not auto-complete).
   */
  let doneStateInitialized = $state(false);

  $effect(() => {
    if (doneStateInitialized || !isFreeForm || mode !== SessionPageMode.Active) return;
    if (sessionExercises.length === 0) return;
    for (const se of sessionExercises) {
      const seSets = sessionExerciseMapService.getOrderedSetsForSessionExercise(se);
      if (seSets.length > 0 && seSets.every((s) => WorkoutSetService.isCompleted(s))) {
        doneExerciseIds.add(se._id);
      }
    }
    doneStateInitialized = true;
  });

  function isExerciseDone(seId: UUID): boolean {
    return doneExerciseIds.has(seId);
  }

  function markExerciseDone(seId: UUID) {
    doneExerciseIds.add(seId);
  }

  function markExerciseEditing(seId: UUID) {
    doneExerciseIds.delete(seId);
  }

  let allExercisesDone = $derived(
    isFreeForm &&
      sessionExercises.length > 0 &&
      sessionExercises.every((se) => doneExerciseIds.has(se._id))
  );

  // --- Previous session exercise & soreness lock ---

  let { previousSessionExerciseMap, sorenessLockedExerciseIds } = $derived.by(() => {
    const prevMap = new SvelteMap<UUID, WorkoutSessionExercise>();
    const locked = new SvelteSet<UUID>();
    if (!mesocycle || !session) {
      return { previousSessionExerciseMap: prevMap, sorenessLockedExerciseIds: locked };
    }
    if (mesocycle.completedDate) {
      for (const se of sessionExercises) locked.add(se.workoutExerciseId);
      return { previousSessionExerciseMap: prevMap, sorenessLockedExerciseIds: locked };
    }
    const exerciseIds = new SvelteSet(sessionExercises.map((se) => se.workoutExerciseId));
    const allMicrocycles = microcycleMapService.getOrderedMicrocyclesForMesocycle(mesocycle._id);
    let foundCurrentSession = false;

    for (const mc of allMicrocycles) {
      const mcSessions = microcycleMapService.getOrderedSessionsForMicrocycle(mc);
      for (const s of mcSessions) {
        if (s._id === session._id) {
          foundCurrentSession = true;
          continue;
        }
        if (!foundCurrentSession) {
          if (!s.complete) continue;
          const ses = sessionMapService.getOrderedSessionExercisesForSession(s);
          for (const se of ses) {
            if (exerciseIds.has(se.workoutExerciseId)) {
              prevMap.set(se.workoutExerciseId, se);
            }
          }
        } else {
          const ses = sessionMapService.getOrderedSessionExercisesForSession(s);
          for (const se of ses) {
            if (locked.has(se.workoutExerciseId)) continue;
            const seSets = sessionExerciseMapService.getOrderedSetsForSessionExercise(se);
            if (seSets.some((set) => WorkoutSetService.isCompleted(set))) {
              locked.add(se.workoutExerciseId);
            }
          }
        }
      }
    }
    return { previousSessionExerciseMap: prevMap, sorenessLockedExerciseIds: locked };
  });

  // --- Card state ---

  function exerciseHasAllSessionMetricsFilled(se: (typeof sessionExercises)[number]): boolean {
    const seSets = sessionExerciseMapService.getOrderedSetsForSessionExercise(se);
    return WorkoutSessionExerciseService.hasAllSessionMetricsFilled(se, seSets);
  }

  function getCardState(index: number): SessionPageExerciseCardState {
    if (mode === SessionPageMode.Planning) return SessionPageExerciseCardState.Current;
    if (mode === SessionPageMode.Review) {
      return exerciseHasAllSessionMetricsFilled(sessionExercises[index])
        ? SessionPageExerciseCardState.Completed
        : SessionPageExerciseCardState.Current;
    }
    if (mode === SessionPageMode.Locked) return SessionPageExerciseCardState.Future;
    if (mode === SessionPageMode.View) return SessionPageExerciseCardState.Completed;

    // Free-form active: use Done state
    if (isFreeForm) {
      const se = sessionExercises[index];
      if (isExerciseDone(se._id)) return SessionPageExerciseCardState.Completed;
      return SessionPageExerciseCardState.Current;
    }

    if (index < currentExerciseIndex) return SessionPageExerciseCardState.Completed;
    if (index === currentExerciseIndex) return SessionPageExerciseCardState.Current;
    return SessionPageExerciseCardState.Future;
  }

  // --- Expand state ---

  let expandedMap = $state<Record<string, boolean | undefined>>({});

  $effect(() => {
    const exercises = sessionExercises;
    if (mode === SessionPageMode.Planning) {
      for (const se of exercises) {
        if (expandedMap[se._id] === undefined) {
          expandedMap[se._id] = true;
        }
      }
    } else if (mode === SessionPageMode.Review) {
      for (const se of exercises) {
        if (!exerciseHasAllSessionMetricsFilled(se) && expandedMap[se._id] === undefined) {
          expandedMap[se._id] = true;
        }
      }
    } else if (isFreeForm) {
      // For free-form, expand all non-done exercises by default
      for (const se of exercises) {
        if (!isExerciseDone(se._id) && expandedMap[se._id] === undefined) {
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

  // --- Free-form exercise management ---

  function handleAddExercise() {
    if (!session) return;
    const alreadyAdded = sessionExercises.map((se) => se.workoutExerciseId);
    exercisePickerDialog.open({
      excludeExerciseIds: alreadyAdded,
      onConfirm: (exerciseIds) => {
        sessionMapService.addExercisesToSession(session._id, exerciseIds);
      }
    });
  }

  function handleRemoveExercise(sessionExerciseId: UUID) {
    if (!session) return;
    sessionMapService.removeExerciseFromSession(session._id, sessionExerciseId);
    doneExerciseIds.delete(sessionExerciseId);
    delete expandedMap[sessionExerciseId];
  }

  function handleDoneExercise(seId: UUID) {
    markExerciseDone(seId);
    expandedMap[seId] = false;
  }

  function handleEditExercise(seId: UUID) {
    markExerciseEditing(seId);
    expandedMap[seId] = true;
  }

  // --- Complete session / review ---

  function handleCompleteSession() {
    if (!session) return;
    sessionMapService.updateDoc(session._id, (doc) => {
      doc.complete = true;
      return doc;
    });

    // Free-form sessions skip deload check
    if (isFreeForm) {
      goto('/');
      return;
    }

    // Check for early deload recommendation before navigating
    if (mesocycle && microcycle) {
      const docs = mesocycleMapService.getAssociatedDocsAndCTOsForMesocycle(mesocycle._id);
      const recommendation = WorkoutMesocycleService.shouldTriggerEarlyDeload(
        mesocycle,
        docs.exerciseCTOs,
        microcycle._id,
        docs.microcycles,
        docs.sessions,
        docs.sessionExercises,
        docs.sets
      );
      if (recommendation.shouldDeload) {
        deloadDialog.open({
          mesocycleTitle: mesocycle.title ?? 'Mesocycle',
          scheduledDeloadDate: null,
          onConfirm: async () => {
            mesocycleMapService.initiateEarlyDeload(mesocycle._id, new Date());
            await goto('/sessions');
          },
          severity: recommendation.severity,
          triggeredRules: recommendation.triggeredRules
        });
        return;
      }
    }

    goto('/sessions');
  }

  function handleCompleteReview() {
    reviewConfirmed = true;
  }

  const lockMessages: Record<WorkoutSessionLockReason, string> = {
    [WorkoutSessionLockReason.MesocycleNotStarted]:
      'Start the mesocycle from the home page to begin logging.',
    [WorkoutSessionLockReason.PreviousMicrocycleNotCompleted]:
      'Advance to the next microcycle from the home page to unlock this session.',
    [WorkoutSessionLockReason.PreviousSessionNotCompleted]:
      'Complete the previous session to unlock this one.'
  };
</script>

<div class="flex flex-col gap-4 p-4">
  {#if !session}
    <SessionPageHeader title="Session" />
    <p class="text-sm text-muted-foreground">Session not found.</p>
  {:else}
    <SessionPageHeader
      title={session.title}
      description={session.description}
      {isFreeForm}
      {mode}
      {session}
    />

    {#if mode !== SessionPageMode.Locked && mode !== SessionPageMode.Planning}
      <SessionPageProgressBar completed={completedCount} total={totalSets} />
    {/if}

    {#if lockReason != null}
      <div class="rounded-lg border border-muted bg-muted/30 px-4 py-3">
        <p class="text-sm text-muted-foreground">{lockMessages[lockReason]}</p>
      </div>
    {/if}

    {#if isFreeForm && sessionExercises.length === 0 && (mode === SessionPageMode.Active || mode === SessionPageMode.Planning)}
      <div
        class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-muted-foreground/30 px-4 py-8"
      >
        <p class="text-sm text-muted-foreground">No exercises yet. Add one to get started.</p>
        <Button variant="outline" onclick={handleAddExercise}>Add Exercise</Button>
      </div>
    {/if}

    {#each sessionExercises as se, i (se._id)}
      <SessionPageExerciseCard
        sessionExercise={se}
        cardState={getCardState(i)}
        {mode}
        expanded={isExpanded(se._id)}
        {allSetsLogged}
        {isFreeForm}
        exerciseDone={isExerciseDone(se._id)}
        onToggle={() => toggleExpanded(se._id)}
        onDone={() => handleDoneExercise(se._id)}
        onEdit={() => handleEditExercise(se._id)}
        onAddSet={() => sessionExerciseMapService.addSetToExercise(se._id)}
        onRemoveSet={(setId) => sessionExerciseMapService.removeSetFromExercise(se._id, setId)}
        onRemoveExercise={() => handleRemoveExercise(se._id)}
        previousSessionExercise={previousSessionExerciseMap.get(se.workoutExerciseId)}
        sorenessLocked={sorenessLockedExerciseIds.has(se.workoutExerciseId)}
      />
    {/each}

    {#if isFreeForm && sessionExercises.length > 0 && (mode === SessionPageMode.Active || mode === SessionPageMode.Planning)}
      <Button variant="outline" class="w-full" onclick={handleAddExercise}>Add Exercise</Button>
    {/if}

    {#if mode !== SessionPageMode.Locked}
      <SessionPageSummaryCard
        completed={completedCount}
        total={totalSets}
        {percent}
        {mode}
        {isFreeForm}
        {allExercisesDone}
        {allImmediateSlidersFilled}
        {allLateFieldsFilled}
        onComplete={handleCompleteSession}
        onCompleteReview={handleCompleteReview}
        onDonePlanning={() => goto('/sessions')}
      />
    {/if}
  {/if}
</div>

<SingletonEditSetDialog />
<SingletonExercisePickerDialog />
