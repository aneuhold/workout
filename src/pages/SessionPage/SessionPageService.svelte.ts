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
import { exercisePickerDialog } from '$components/singletons/dialogs/SingletonExercisePickerDialog/SingletonExercisePickerDialog.svelte';
import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
import microcycleMapService from '$services/documentMapServices/microcycleMapService.svelte';
import sessionExerciseMapService from '$services/documentMapServices/sessionExerciseMapService.svelte';
import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';
import { SessionPageExerciseCardState, SessionPageMode } from './sessionPageTypes';
import {
  deriveCardState,
  deriveCurrentExerciseIndex,
  deriveDataMode,
  deriveMode,
  derivePreviousSessionExerciseData,
  exerciseHasAllSessionMetricsFilled
} from './sessionPageUtils';

/**
 * Page-scoped reactive service for the SessionPage.
 * Owns all derived session state and actions, eliminating prop drilling to sub-components.
 * Call {@link init} from SessionPage whenever sessionId or planning changes.
 */
class SessionPageService {
  // --- Private mutable state ---

  #sessionId = $state<UUID | null>(null);
  #planning = $state(false);
  #expandedMap = $state<Record<string, boolean | undefined>>({});
  #doneExerciseIds = new SvelteSet<UUID>();
  #doneStateInitialized = $state(false);
  #wasInReviewMode = $state(false);
  #reviewConfirmed = $state(false);

  // --- Session data (derived in dependency order) ---

  session = $derived(this.#sessionId ? sessionMapService.getDoc(this.#sessionId) : undefined);

  isFreeForm = $derived(this.session ? sessionMapService.isFreeFormSession(this.session) : false);

  sessionExercises = $derived(
    this.session ? sessionMapService.getOrderedSessionExercisesForSession(this.session) : []
  );

  allSets = $derived(this.session ? sessionMapService.getOrderedSetsForSession(this.session) : []);

  microcycle = $derived(
    this.session?.workoutMicrocycleId
      ? microcycleMapService.getDoc(this.session.workoutMicrocycleId)
      : undefined
  );

  completedCount = $derived(this.allSets.filter((s) => WorkoutSetService.isCompleted(s)).length);

  totalSets = $derived(this.allSets.length);

  allImmediateSlidersFilled = $derived(
    this.sessionExercises.every((se) => {
      const seSets = sessionExerciseMapService.getOrderedSetsForSessionExercise(se);
      return WorkoutSessionExerciseService.hasMidSessionMetricsFilled(se, seSets);
    })
  );

  allLateFieldsFilled = $derived(
    this.sessionExercises.length > 0 &&
      this.sessionExercises.every((se) => exerciseHasAllSessionMetricsFilled(se))
  );

  currentExerciseIndex = $derived(deriveCurrentExerciseIndex(this.sessionExercises));

  mesocycle = $derived(
    this.microcycle?.workoutMesocycleId
      ? mesocycleMapService.getDoc(this.microcycle.workoutMesocycleId)
      : undefined
  );

  percent = $derived(
    this.totalSets > 0 ? Math.round((this.completedCount / this.totalSets) * 100) : 0
  );

  allSetsLogged = $derived(this.completedCount >= this.totalSets && this.totalSets > 0);

  allExercisesDone = $derived(
    this.isFreeForm &&
      this.sessionExercises.length > 0 &&
      this.sessionExercises.every((se) => this.#doneExerciseIds.has(se._id))
  );

  previousMicrocycle = $derived.by(() => {
    const { microcycle, mesocycle } = this;
    if (!microcycle || !mesocycle) return undefined;
    const orderedMicrocycles = microcycleMapService.getOrderedMicrocyclesForMesocycle(
      mesocycle._id
    );
    const currentIndex = orderedMicrocycles.findIndex((mc) => mc._id === microcycle._id);
    return currentIndex > 0 ? orderedMicrocycles[currentIndex - 1] : undefined;
  });

  previousSessionInMicrocycle = $derived.by(() => {
    const { microcycle, session } = this;
    if (!microcycle || !session) return undefined;
    const sessionIndex = microcycle.sessionOrder.indexOf(session._id);
    if (sessionIndex <= 0) return undefined;
    return sessionMapService.getDoc(microcycle.sessionOrder[sessionIndex - 1]);
  });

  lockReason = $derived(
    WorkoutSessionService.getSessionLockReason(
      this.microcycle,
      this.mesocycle,
      this.previousMicrocycle,
      this.previousSessionInMicrocycle
    )
  );

  /**
   * The raw data mode, before sticky review-mode logic is applied.
   * Exposed so SessionPage can track when review mode is first entered.
   */
  dataMode: SessionPageMode = $derived(
    deriveDataMode(this.session, this.#planning, this.lockReason, this.sessionExercises)
  );

  /** The effective display mode, including sticky review-mode behavior. */
  mode: SessionPageMode = $derived(
    deriveMode(this.dataMode, this.#planning, this.#wasInReviewMode, this.#reviewConfirmed)
  );

  readonly lockMessages: Record<WorkoutSessionLockReason, string> = {
    [WorkoutSessionLockReason.MesocycleNotStarted]:
      'Start the mesocycle from the home page to begin logging.',
    [WorkoutSessionLockReason.PreviousMicrocycleNotCompleted]:
      'Advance to the next microcycle from the home page to unlock this session.',
    [WorkoutSessionLockReason.PreviousSessionNotCompleted]:
      'Complete the previous session to unlock this one.'
  };

  // Shared computation for prevMap and locked to avoid running the loop twice.
  #prevSessionData = $derived(
    derivePreviousSessionExerciseData(
      this.mesocycle,
      this.session,
      this.sessionExercises,
      this.microcycle
    )
  );

  previousSessionExerciseMap: SvelteMap<UUID, WorkoutSessionExercise> = $derived(
    this.#prevSessionData.prevMap
  );

  sorenessLockedExerciseIds: SvelteSet<UUID> = $derived(this.#prevSessionData.locked);

  // --- Expansion state ---

  /**
   * Returns whether the card for the given session exercise ID is expanded.
   *
   * @param id The session exercise ID
   */
  isExpanded(id: string): boolean {
    return this.#expandedMap[id] ?? false;
  }

  /**
   * Toggles the expanded state of the card for the given session exercise ID.
   *
   * @param id The session exercise ID
   */
  toggleExpanded(id: string): void {
    this.#expandedMap[id] = !this.isExpanded(id);
  }

  // --- Free-form done state ---

  /**
   * Returns whether the exercise with the given session exercise ID is marked as done.
   *
   * @param seId The session exercise ID
   */
  isExerciseDone(seId: UUID): boolean {
    return this.#doneExerciseIds.has(seId);
  }

  /**
   * Marks the exercise with the given session exercise ID as done.
   *
   * @param seId The session exercise ID
   */
  markExerciseDone(seId: UUID): void {
    this.#doneExerciseIds.add(seId);
  }

  /**
   * Removes the done mark from the exercise with the given session exercise ID.
   *
   * @param seId The session exercise ID
   */
  markExerciseEditing(seId: UUID): void {
    this.#doneExerciseIds.delete(seId);
  }

  // --- Card state ---

  /**
   * Returns the visual card state for the exercise at the given index.
   *
   * @param index The index of the exercise in the session
   */
  getCardState(index: number): SessionPageExerciseCardState {
    return deriveCardState(
      index,
      this.mode,
      this.isFreeForm,
      this.sessionExercises,
      this.currentExerciseIndex,
      (id) => this.#doneExerciseIds.has(id)
    );
  }

  // --- Lifecycle ---

  /**
   * Initializes or re-initializes the service for a session.
   * Resets all per-session state when the session ID changes.
   *
   * @param sessionId The session ID to load, or null
   * @param planning Whether the page is in planning mode
   */
  init(sessionId: UUID | null, planning: boolean): void {
    if (sessionId !== this.#sessionId) {
      for (const key of Object.keys(this.#expandedMap)) {
        delete this.#expandedMap[key];
      }
      this.#doneExerciseIds.clear();
      this.#doneStateInitialized = false;
      this.#wasInReviewMode = false;
      this.#reviewConfirmed = false;
    }
    this.#sessionId = sessionId;
    this.#planning = planning;
  }

  // --- Effects (called from SessionPage $effect blocks) ---

  /**
   * Marks that the session was in review mode. Called from SessionPage when dataMode is Review.
   * Once set, persists until init() resets it — prevents re-entering review after all late fields are filled.
   */
  setWasInReviewMode(): void {
    this.#wasInReviewMode = true;
  }

  /**
   * Initializes done state from persisted set data (one-time, on first active render).
   * Marks exercises with all sets completed as done at page load, so the UI starts correctly.
   */
  tryInitDoneState(): void {
    if (this.#doneStateInitialized || !this.isFreeForm || this.mode !== SessionPageMode.Active) {
      return;
    }
    const { sessionExercises } = this;
    if (sessionExercises.length === 0) return;
    for (const se of sessionExercises) {
      const seSets = sessionExerciseMapService.getOrderedSetsForSessionExercise(se);
      if (seSets.length > 0 && seSets.every((s) => WorkoutSetService.isCompleted(s))) {
        this.#doneExerciseIds.add(se._id);
      }
    }
    this.#doneStateInitialized = true;
  }

  /**
   * Expands cards that should be open by default based on mode, done state, and current progress.
   * Only sets cards to expanded — never collapses an already-set card.
   * Called from a SessionPage $effect so it re-runs when mode/exercises/done state changes.
   */
  syncExpandedCards(): void {
    const { mode, sessionExercises, isFreeForm, currentExerciseIndex } = this;
    if (mode === SessionPageMode.Planning) {
      for (const se of sessionExercises) {
        if (this.#expandedMap[se._id] === undefined) {
          this.#expandedMap[se._id] = true;
        }
      }
    } else if (mode === SessionPageMode.Review) {
      for (const se of sessionExercises) {
        if (!exerciseHasAllSessionMetricsFilled(se) && this.#expandedMap[se._id] === undefined) {
          this.#expandedMap[se._id] = true;
        }
      }
    } else if (isFreeForm) {
      for (const se of sessionExercises) {
        if (!this.isExerciseDone(se._id) && this.#expandedMap[se._id] === undefined) {
          this.#expandedMap[se._id] = true;
        }
      }
    } else {
      const idx = currentExerciseIndex;
      if (sessionExercises.length > 0 && sessionExercises[idx]) {
        const currentId = sessionExercises[idx]._id;
        if (this.#expandedMap[currentId] === undefined) {
          this.#expandedMap[currentId] = true;
        }
      }
    }
  }

  // --- Actions ---

  /** Opens the exercise picker to add exercises to the current free-form session. */
  handleAddExercise(): void {
    const { session, sessionExercises } = this;
    if (!session) return;
    const alreadyAdded = sessionExercises.map((se) => se.workoutExerciseId);
    exercisePickerDialog.open({
      excludeExerciseIds: alreadyAdded,
      onConfirm: (exerciseIds) => {
        sessionMapService.addExercisesToSession(session._id, exerciseIds);
      }
    });
  }

  /**
   * Removes an exercise from the current free-form session.
   *
   * @param sessionExerciseId The session exercise ID to remove
   */
  handleRemoveExercise(sessionExerciseId: UUID): void {
    const { session } = this;
    if (!session) return;
    sessionMapService.removeExerciseFromSession(session._id, sessionExerciseId);
    this.#doneExerciseIds.delete(sessionExerciseId);
    delete this.#expandedMap[sessionExerciseId];
  }

  /**
   * Marks a free-form exercise as done and collapses its card.
   *
   * @param seId The session exercise ID to mark as done
   */
  handleDoneExercise(seId: UUID): void {
    this.markExerciseDone(seId);
    this.#expandedMap[seId] = false;
  }

  /**
   * Marks a free-form exercise as editing (undoes done) and expands its card.
   *
   * @param seId The session exercise ID to resume editing
   */
  handleEditExercise(seId: UUID): void {
    this.markExerciseEditing(seId);
    this.#expandedMap[seId] = true;
  }

  /** Completes the session, checks for early deload recommendation, and navigates away. */
  handleCompleteSession(): void {
    const { session, isFreeForm, sessionExercises, mesocycle, microcycle } = this;
    if (!session) return;

    sessionMapService.updateDoc(session._id, (doc) => {
      doc.complete = true;
      return doc;
    });

    if (isFreeForm) {
      // Auto-generate calibrations from the session's best sets so newly
      // performed exercises stop showing the "not calibrated" warning.
      // Mesocycle sessions defer this to mesocycleMapService.endMesocycle so
      // all calibrations land in one batch at the end of the cycle.
      sessionMapService.generateAutoCalibrationsForCompletedFreeFormSession(
        session.userId,
        sessionExercises
      );
      void goto('/');
      return;
    }

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

    void goto('/sessions');
  }

  /** Confirms the post-session review, allowing mode to advance to View. */
  handleCompleteReview(): void {
    this.#reviewConfirmed = true;
  }

  /** Navigates to the sessions list (used in planning mode). */
  handleDonePlanning(): void {
    void goto('/sessions');
  }
}

export default new SessionPageService();
