<!--
  @component

  Hero card at the top of the home page. Orchestrates all "next action" states:
  continue session, free-form session, start session, complete microcycle,
  start mesocycle, or complete mesocycle. Shows late indicators when a session
  is behind schedule.

  Owns its own state derivation from the passed-in data, as well as all action
  handlers (move dialog, deload dialog, navigation, regeneration).
-->
<script lang="ts">
  import type {
    WorkoutMesocycle,
    WorkoutMicrocycle,
    WorkoutSession
  } from '@aneuhold/core-ts-db-lib';
  import { CycleType, WorkoutMesocycleService } from '@aneuhold/core-ts-db-lib';
  import { DateService } from '@aneuhold/core-ts-lib';
  import { goto } from '$app/navigation';
  import { deloadDialog } from '$components/singletons/dialogs/SingletonDeloadDialog/SingletonDeloadDialog.svelte';
  import { moveSessionsDialog } from '$components/singletons/dialogs/SingletonMoveSessionsDialog/SingletonMoveSessionsDialog.svelte';
  import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
  import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';
  import type { HomePageSessionBundle } from '../homePageUtils';
  import { regenerateMesocycle } from '../homePageUtils';
  import { getHeroCardState, HeroCardAction } from './heroCardUtils';
  import HomePageHeroCardCompleteMesocycle from './HomePageHeroCardCompleteMesocycle.svelte';
  import HomePageHeroCardCompleteMicrocycle from './HomePageHeroCardCompleteMicrocycle.svelte';
  import HomePageHeroCardContinueSession from './HomePageHeroCardContinueSession.svelte';
  import HomePageHeroCardEditMesocycle from './HomePageHeroCardEditMesocycle.svelte';
  import HomePageHeroCardFreeFormSession from './HomePageHeroCardFreeFormSession.svelte';
  import HomePageHeroCardStartMesocycle from './HomePageHeroCardStartMesocycle.svelte';
  import HomePageHeroCardStartSession from './HomePageHeroCardStartSession.svelte';

  let {
    activeMesocycle,
    microcycles,
    sessions,
    inProgressSession,
    nextUpSession,
    pendingLogs
  }: {
    activeMesocycle: WorkoutMesocycle | null;
    microcycles: WorkoutMicrocycle[];
    sessions: WorkoutSession[];
    inProgressSession: WorkoutSession | null;
    nextUpSession: WorkoutSession | null;
    pendingLogs: HomePageSessionBundle[];
  } = $props();

  // --- Hero session (for mesocycle-based states) ---

  const heroSession = $derived(inProgressSession ?? nextUpSession);

  const heroSessionExercises = $derived(
    heroSession ? sessionMapService.getOrderedSessionExercisesForSession(heroSession) : []
  );
  const heroSessionSets = $derived(
    heroSession ? sessionMapService.getOrderedSetsForSession(heroSession) : []
  );

  // --- Free-form derivations ---

  const freeFormSession: WorkoutSession | undefined = $derived(
    sessionMapService.freeFormSessions.inProgress[0]
  );
  const freeFormExercises = $derived(
    freeFormSession ? sessionMapService.getOrderedSessionExercisesForSession(freeFormSession) : []
  );
  const freeFormSets = $derived(
    freeFormSession ? sessionMapService.getOrderedSetsForSession(freeFormSession) : []
  );

  // --- Hero card state ---

  const state = $derived(
    getHeroCardState(
      activeMesocycle,
      microcycles,
      sessions,
      inProgressSession,
      nextUpSession,
      pendingLogs,
      heroSessionExercises,
      heroSessionSets,
      freeFormSession,
      freeFormExercises,
      freeFormSets
    )
  );

  const hasFutureMesocycles = $derived(
    mesocycleMapService.allDocs.filter(
      (m) => m._id !== activeMesocycle?._id && m.completedDate == null
    ).length > 0
  );

  /** True when the hero session belongs to the deload microcycle. */
  const isOnDeloadMicrocycle = $derived.by(() => {
    if (!activeMesocycle || !heroSession?.workoutMicrocycleId) return false;
    if (activeMesocycle.cycleType === CycleType.Resensitization) return false;
    const lastMicrocycle = microcycles[microcycles.length - 1];
    return lastMicrocycle._id === heroSession.workoutMicrocycleId;
  });

  // --- Action handlers ---

  /** Advances to the next microcycle, triggering deload check if needed. */
  function handleCompleteMicrocycle() {
    if (!activeMesocycle || state?.action !== HeroCardAction.CompleteMicrocycle) return;

    const { completedMicrocycleNumber } = state;
    const docs = mesocycleMapService.getAssociatedDocsAndCTOsForMesocycle(activeMesocycle._id);
    const completedMicrocycle = docs.microcycles[completedMicrocycleNumber - 1];

    regenerateMesocycle(activeMesocycle, { completedMicrocycleNumber });

    const recommendation = WorkoutMesocycleService.shouldTriggerEarlyDeload(
      activeMesocycle,
      docs.exerciseCTOs,
      completedMicrocycle._id,
      docs.microcycles,
      docs.sessions,
      docs.sessionExercises,
      docs.sets
    );

    if (recommendation.shouldDeload) {
      deloadDialog.open({
        mesocycleTitle: activeMesocycle.title ?? 'Mesocycle',
        scheduledDeloadDate: null,
        onConfirm: () => {
          return Promise.resolve(
            mesocycleMapService.initiateEarlyDeload(activeMesocycle._id, new Date())
          );
        },
        severity: recommendation.severity,
        triggeredRules: recommendation.triggeredRules
      });
    }
  }

  /** Marks the mesocycle as complete. */
  function handleCompleteMesocycle() {
    if (!activeMesocycle) return;
    mesocycleMapService.endMesocycle(activeMesocycle._id);
  }

  /** Starts the mesocycle by setting the start date and regenerating. */
  function handleStartMesocycle() {
    if (!activeMesocycle) return;
    regenerateMesocycle(activeMesocycle, { startMesocycle: true });
  }

  /**
   * Handles the start session button click. Navigates directly for on-time
   * sessions, or opens the move sessions dialog when the session is late.
   */
  function handleStartSession() {
    if (state?.action !== HeroCardAction.StartSession) return;

    const { daysLate, session } = state;
    const isLate = daysLate > 0;

    if (!isLate) {
      goto(`/session?sessionId=${session._id}`);
      return;
    }

    if (!activeMesocycle || !state.scheduledDate) return;

    const { scheduledDate } = state;

    const currentEndDate = WorkoutMesocycleService.getProjectedEndDate(
      activeMesocycle,
      microcycles
    );
    const newEndDate = currentEndDate ? DateService.addDays(currentEndDate, daysLate) : null;

    const showDeload = daysLate >= 3 && !isOnDeloadMicrocycle;

    moveSessionsDialog.open({
      session,
      daysLate,
      scheduledDate,
      mesocycleEndDate: currentEndDate,
      newMesocycleEndDate: newEndDate,
      hasFutureMesocycles,
      onMove: async () => {
        mesocycleMapService.moveMesocycle(activeMesocycle._id, daysLate, true);
        await goto(`/session?sessionId=${session._id}`);
      },
      onSkip: () => {
        goto(`/session?sessionId=${session._id}`);
      },
      onDeload: showDeload
        ? () => {
            openDeloadFromMoveDialog();
          }
        : undefined
    });
  }

  /**
   * Opens the deload confirmation dialog from the move sessions dialog.
   */
  function openDeloadFromMoveDialog() {
    if (!activeMesocycle) return;

    deloadDialog.open({
      mesocycleTitle: activeMesocycle.title ?? 'Mesocycle',
      scheduledDeloadDate: null,
      onConfirm: () => {
        mesocycleMapService.initiateEarlyDeload(activeMesocycle._id, new Date());
        return Promise.resolve();
      }
    });
  }
</script>

{#if state?.action === HeroCardAction.ContinueSession}
  <HomePageHeroCardContinueSession {state} />
{:else if state?.action === HeroCardAction.FreeFormSession}
  <HomePageHeroCardFreeFormSession {state} />
{:else if state?.action === HeroCardAction.StartSession}
  <HomePageHeroCardStartSession {state} onStartSession={handleStartSession} />
{:else if state?.action === HeroCardAction.CompleteMicrocycle}
  <HomePageHeroCardCompleteMicrocycle
    completedMicrocycleNumber={state.completedMicrocycleNumber}
    blockedByPendingReviews={state.blockedByPendingReviews}
    onCompleteMicrocycle={handleCompleteMicrocycle}
  />
{:else if state?.action === HeroCardAction.EditMesocycle}
  <HomePageHeroCardEditMesocycle
    mesocycleId={state.mesocycleId}
    mesocycleTitle={state.mesocycleTitle}
    startDate={state.startDate}
  />
{:else if state?.action === HeroCardAction.StartMesocycle}
  <HomePageHeroCardStartMesocycle
    mesocycleTitle={state.mesocycleTitle}
    onStartMesocycle={handleStartMesocycle}
  />
{:else if state?.action === HeroCardAction.CompleteMesocycle}
  <HomePageHeroCardCompleteMesocycle
    blockedByPendingReviews={state.blockedByPendingReviews}
    onCompleteMesocycle={handleCompleteMesocycle}
  />
{/if}
