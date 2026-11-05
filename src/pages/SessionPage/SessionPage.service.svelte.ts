import {
  WorkoutMesocycleService,
  type WorkoutSession,
  type WorkoutSessionExercise,
  WorkoutSessionExerciseService,
  WorkoutSessionLockReason,
  WorkoutSetService
} from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { Updater } from 'svelte/store';
import { goto } from '$app/navigation';
import { deloadDialog } from '$components/singletons/dialogs/SingletonDeloadDialog/SingletonDeloadDialog.svelte';
import { exercisePickerDialog } from '$components/singletons/dialogs/SingletonExercisePickerDialog/SingletonExercisePickerDialog.svelte';
import mesocycleMapService from '$services/documentMapServices/MesocycleMap.service.svelte';
import microcycleMapService from '$services/documentMapServices/MicrocycleMap.service.svelte';
import sessionExerciseMapService from '$services/documentMapServices/SessionExerciseMap.service.svelte';
import sessionMapService from '$services/documentMapServices/SessionMap.service.svelte';
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
 *
 * Without a session ID, the page works on an unsaved free-form draft session. The draft is saved
 * when the first exercises are added, and discarded if the user leaves before that.
 */
class SessionPageService {
  // --- Private mutable state ---

  #sessionId = $state<UUID | null>(null);
  #draftSession = $state<WorkoutSession | null>(null);
  #planning = $state(false);
  #expandedMap = $state<Record<string, boolean | undefined>>({});
  #doneExerciseIds = new SvelteSet<UUID>();
  #doneStateInitialized = $state(false);
  #wasInReviewMode = $state(false);
  #reviewConfirmed = $state(false);

  // --- Session data (derived in dependency order) ---

  session = $derived(
    this.#draftSession ?? (this.#sessionId ? sessionMapService.getDoc(this.#sessionId) : undefined)
  );

  /** True while the session is an unsaved free-form draft. */
  isDraft = $derived(this.#draftSession !== null);

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

  previousSessionInMicrocycle = $derived.by(() => {
    const { microcycle, session } = this;
    if (!microcycle || !session) return undefined;
    const sessionIndex = microcycle.sessionOrder.indexOf(session._id);
    if (sessionIndex <= 0) return undefined;
    return sessionMapService.getDoc(microcycle.sessionOrder[sessionIndex - 1]);
  });

  lockReason = $derived(
    this.mesocycle && this.session
      ? WorkoutMesocycleService.getSessionLockReason(
          this.mesocycle,
          microcycleMapService.getOrderedMicrocyclesForMesocycle(this.mesocycle._id),
          this.session,
          this.previousSessionInMicrocycle
        )
      : null
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

  /**
   * Interaction state for the slider fields recorded during the workout (mind-muscle connection,
   * pump, unused muscle performance). Interactive in Active mode, highlighted once all sets are
   * logged, read-only otherwise.
   */
  immediateFieldState = $derived({
    disabled: this.mode !== SessionPageMode.Active,
    highlight: this.mode === SessionPageMode.Active && this.allSetsLogged
  });

  /**
   * Interaction state for the slider fields recorded after the workout (disruption, perceived
   * effort, joint and tissue disruption). Interactive and highlighted in Review mode, read-only
   * otherwise.
   */
  lateFieldState = $derived({
    disabled: this.mode !== SessionPageMode.Review,
    highlight: this.mode === SessionPageMode.Review
  });

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
   * @param sessionId The session ID to load, or null to start a new free-form draft session
   * @param planning Whether the page is in planning mode
   */
  init(sessionId: UUID | null, planning: boolean): void {
    const draftSession = sessionId ? null : sessionMapService.buildFreeFormSession();
    const nextSessionId = draftSession?._id ?? sessionId;
    if (nextSessionId !== this.#sessionId) {
      for (const key of Object.keys(this.#expandedMap)) {
        delete this.#expandedMap[key];
      }
      this.#doneExerciseIds.clear();
      this.#doneStateInitialized = false;
      this.#wasInReviewMode = false;
      this.#reviewConfirmed = false;
    }
    this.#draftSession = draftSession;
    this.#sessionId = nextSessionId;
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

  /**
   * Applies a change to the current session. A draft session is changed locally only, a saved
   * session is persisted. This should always be used in session pages vs the map.
   *
   * There's probably a better abstraction, but this seemed okay for now.
   *
   * @param mutator Function that changes and returns the session
   */
  updateSession(mutator: Updater<WorkoutSession>): void {
    if (this.#draftSession) {
      this.#draftSession = mutator(this.#draftSession);
    } else if (this.session) {
      sessionMapService.updateDoc(this.session._id, mutator);
    }
  }

  /**
   * Opens the exercise picker to add exercises to the current free-form session. Saves the
   * session first if it is a draft, and points the URL at the saved session.
   */
  handleAddExercise(): void {
    const { session, sessionExercises } = this;
    if (!session) return;
    const alreadyAdded = sessionExercises.map((se) => se.workoutExerciseId);
    exercisePickerDialog.open({
      excludeExerciseIds: alreadyAdded,
      onConfirm: async (exerciseIds) => {
        if (this.#draftSession) {
          await this.#saveDraftSession(this.#draftSession);
        }
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

  /**
   * Navigates away from the session, then marks it complete and checks for an early deload
   * recommendation. Navigating first keeps the page from re-rendering in review mode, and lets
   * the deload dialog open on the destination page so dismissing it leaves the user there.
   */
  async handleCompleteSession(): Promise<void> {
    const { session, isFreeForm, sessionExercises, mesocycle, microcycle } = this;
    if (!session) return;

    await goto('/');

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
      return;
    }

    if (!mesocycle || !microcycle) return;
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
        mesocycleId: mesocycle._id,
        scheduledDeloadDate: null,
        severity: recommendation.severity,
        triggeredRules: recommendation.triggeredRules
      });
    }
  }

  /**
   * Navigates home, then marks the review as confirmed so it doesn't flicker the UI while the user
   * is looking at the session.
   */
  async handleCompleteReview(): Promise<void> {
    await goto('/');
    this.#reviewConfirmed = true;
  }

  /** Just goes back, in case they came from a current session, or the session page. */
  handleDonePlanning(): void {
    history.back();
  }

  /**
   * Persists the draft session and points the URL at the saved session.
   *
   * @param draftSession The draft session to save
   */
  async #saveDraftSession(draftSession: WorkoutSession): Promise<void> {
    sessionMapService.addDoc(draftSession);
    this.#draftSession = null;
    const planningParam = this.#planning ? '&planningMode=true' : '';
    await goto(`/session?sessionId=${draftSession._id}${planningParam}`, { replaceState: true });
  }
}

const sessionPageService = new SessionPageService();
export default sessionPageService;
