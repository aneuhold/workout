<!--
  @component

  Hero card at the top of the home page. Orchestrates all "next action" states:
  continue session, start session, complete microcycle, start mesocycle, or
  complete mesocycle. Shows late indicators when a session is behind schedule.

  Owns its own state derivation from the passed-in data, as well as all action
  handlers (move dialog, deload dialog, navigation, regeneration).
-->
<script lang="ts">
  import type {
    WorkoutMesocycle,
    WorkoutMicrocycle,
    WorkoutSession
  } from '@aneuhold/core-ts-db-lib';
  import { WorkoutMesocycleService } from '@aneuhold/core-ts-db-lib';
  import { DateService } from '@aneuhold/core-ts-lib';
  import { IconChevronRight, IconEdit, IconSparkles, IconTrophy } from '@tabler/icons-svelte';
  import { goto } from '$app/navigation';
  import { countCompletedSets } from '$components/SessionCard/sessionCardUtils';
  import { triggerConfetti } from '$components/singletons/Confetti/Confetti.svelte';
  import { deloadDialog } from '$components/singletons/dialogs/SingletonDeloadDialog/SingletonDeloadDialog.svelte';
  import { moveSessionsDialog } from '$components/singletons/dialogs/SingletonMoveSessionsDialog/SingletonMoveSessionsDialog.svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
  import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import Progress from '$ui/Progress/Progress.svelte';
  import { cn } from '$util/svelte-shadcn-util';
  import { getHeroCardState, HeroCardAction } from './heroCardUtils';
  import type { HomePageSessionBundle } from './homePageUtils';
  import { regenerateMesocycle } from './homePageUtils';

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

  // --- Hero card state ---

  const heroSession = $derived(inProgressSession ?? nextUpSession);

  const heroSessionExercises = $derived(
    heroSession ? sessionMapService.getOrderedSessionExercisesForSession(heroSession) : []
  );
  const heroSessionSets = $derived(
    heroSession ? sessionMapService.getOrderedSetsForSession(heroSession) : []
  );

  const state = $derived(
    getHeroCardState(
      activeMesocycle,
      microcycles,
      sessions,
      inProgressSession,
      nextUpSession,
      pendingLogs,
      heroSessionExercises,
      heroSessionSets
    )
  );

  const hasFutureMesocycles = $derived(
    mesocycleMapService.allDocs.filter(
      (m) => m._id !== activeMesocycle?._id && m.completedDate == null
    ).length > 0
  );

  // --- Session-related derivations (only used for ContinueSession / StartSession) ---

  const sessionState = $derived(
    state?.action === HeroCardAction.ContinueSession ||
      state?.action === HeroCardAction.StartSession
      ? state
      : null
  );

  const totalSets = $derived(sessionState?.sets.length ?? 0);
  const completed = $derived(sessionState ? countCompletedSets(sessionState.sets) : 0);
  const percent = $derived(totalSets > 0 ? Math.round((completed / totalSets) * 100) : 0);

  const exerciseBadges = $derived(
    sessionState?.sessionExercises.map((se) => ({
      id: se._id,
      name: exerciseMapService.getDoc(se.workoutExerciseId)?.exerciseName ?? 'Unknown'
    })) ?? []
  );

  const isInProgress = $derived(state?.action === HeroCardAction.ContinueSession);

  const daysLate = $derived(state?.action === HeroCardAction.StartSession ? state.daysLate : 0);
  const isLate = $derived(daysLate > 0);
  const isSeverelyLate = $derived(daysLate >= 3);

  const scheduledDateFormatted = $derived(
    state?.action === HeroCardAction.StartSession && state.scheduledDate
      ? state.scheduledDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      : null
  );

  const lateLabel = $derived(daysLate === 1 ? '1 day late' : `${daysLate} days late`);

  const ringClass = $derived(isLate ? 'ring-amber-500/30 ring-2' : 'ring-primary/30 ring-2');

  // --- Action handlers ---

  function handleCompleteMicrocycle() {
    if (!activeMesocycle || state?.action !== HeroCardAction.CompleteMicrocycle) return;
    regenerateMesocycle(activeMesocycle, {
      completedMicrocycleNumber: state.completedMicrocycleNumber
    });
  }

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

    if (!isLate) {
      goto(`/session?sessionId=${state.session._id}`);
      return;
    }

    if (!activeMesocycle || !state.scheduledDate) return;

    const { daysLate: late, scheduledDate: scheduled, session } = state;

    const currentEndDate = WorkoutMesocycleService.getProjectedEndDate(
      activeMesocycle,
      microcycles
    );
    const newEndDate = currentEndDate ? DateService.addDays(currentEndDate, late) : null;

    const showDeload = late >= 3;

    moveSessionsDialog.open({
      session,
      daysLate: late,
      scheduledDate: scheduled,
      mesocycleEndDate: currentEndDate,
      newMesocycleEndDate: newEndDate,
      hasFutureMesocycles,
      onMove: async () => {
        mesocycleMapService.moveMesocycle(activeMesocycle._id, late, true);
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

{#if state}
  <!-- Continue Session / Start Session -->
  {#if state.action === HeroCardAction.ContinueSession || state.action === HeroCardAction.StartSession}
    <Card class={ringClass}>
      <CardHeader>
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold">
            {isInProgress ? 'Continue Session' : 'Next Up'}
          </span>
          {#if isInProgress}
            <Button size="sm" href="/session?sessionId={state.session._id}">
              Continue
              <IconChevronRight size={14} />
            </Button>
          {:else}
            <Button size="sm" onclick={handleStartSession}>
              Start Session
              <IconChevronRight size={14} />
            </Button>
          {/if}
        </div>
      </CardHeader>
      <CardContent class="flex flex-col gap-2">
        <span class="text-sm font-medium">{state.session.title}</span>
        {#if isLate && !isInProgress}
          <Badge
            variant="outline"
            class={cn(
              isSeverelyLate
                ? 'border-destructive text-destructive'
                : 'border-amber-500 text-amber-500'
            )}
          >
            {lateLabel}
          </Badge>
        {/if}
        {#if isInProgress}
          <Progress value={percent} max={100} class="h-1.5" />
          <span class="text-xs text-muted-foreground">{completed}/{totalSets} sets completed</span>
        {:else if isLate}
          <div class={cn('text-xs', isSeverelyLate ? 'text-destructive' : 'text-amber-500')}>
            Scheduled for {scheduledDateFormatted} &mdash; {daysLate} day{daysLate === 1 ? '' : 's'} behind
          </div>
        {:else}
          <div class="text-xs text-muted-foreground">
            {sessionState?.sessionExercises.length ?? 0} exercises · {totalSets} sets
          </div>
          <div class="flex flex-wrap gap-1">
            {#each exerciseBadges as { id, name } (id)}
              <Badge variant="outline" class="h-auto whitespace-normal text-xs">{name}</Badge>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
    <!-- Complete Microcycle -->
  {:else if state.action === HeroCardAction.CompleteMicrocycle}
    <Card class="ring-green-500/30 ring-2">
      <CardHeader>
        <div class="flex items-center gap-2">
          <IconTrophy size={18} class="text-green-500" />
          <span class="text-sm font-semibold text-green-600 dark:text-green-400">
            Microcycle {state.completedMicrocycleNumber} Complete!
          </span>
        </div>
      </CardHeader>
      <CardContent class="flex flex-col gap-3">
        {#if state.blockedByPendingReviews}
          <p class="text-xs text-muted-foreground">
            Fill in your session reviews before advancing to the next microcycle. This helps
            optimize your upcoming training.
          </p>
          <Button size="sm" disabled>Advance to Next Microcycle</Button>
        {:else}
          <p class="text-xs text-muted-foreground">
            Your next session will be ready after advancing.
          </p>
          <Button
            size="sm"
            onclick={(e: MouseEvent) => {
              triggerConfetti(e.clientX, e.clientY);
              handleCompleteMicrocycle();
            }}
          >
            Advance to Next Microcycle
            <IconChevronRight size={14} />
          </Button>
        {/if}
      </CardContent>
    </Card>
    <!-- Edit Mesocycle (not yet started) -->
  {:else if state.action === HeroCardAction.EditMesocycle}
    <Card class="ring-primary/30 ring-2">
      <CardHeader>
        <div class="flex items-center gap-2">
          <IconEdit size={18} class="text-primary" />
          <span class="text-sm font-semibold">{state.mesocycleTitle}</span>
        </div>
      </CardHeader>
      <CardContent class="flex flex-col gap-3">
        <p class="text-xs text-muted-foreground">
          Scheduled to start {state.startDate.toLocaleDateString()}
        </p>
        <Button size="sm" href="/mesocycle?mesocycleId={state.mesocycleId}">
          Edit Mesocycle
          <IconChevronRight size={14} />
        </Button>
      </CardContent>
    </Card>
    <!-- Start Mesocycle (ready to begin) -->
  {:else if state.action === HeroCardAction.StartMesocycle}
    <Card class="ring-primary/30 ring-2">
      <CardHeader>
        <div class="flex items-center gap-2">
          <IconSparkles size={18} class="text-primary" />
          <span class="text-sm font-semibold">{state.mesocycleTitle}</span>
        </div>
      </CardHeader>
      <CardContent class="flex flex-col gap-3">
        <p class="text-xs text-muted-foreground">
          Your plan will be optimized based on the latest calibration data.
        </p>
        <Button size="sm" onclick={handleStartMesocycle}>
          Start Mesocycle
          <IconChevronRight size={14} />
        </Button>
      </CardContent>
    </Card>
    <!-- Complete Mesocycle (all microcycles done) -->
  {:else if state.action === HeroCardAction.CompleteMesocycle}
    <Card class="ring-green-500/30 ring-2">
      <CardHeader>
        <div class="flex items-center gap-2">
          <IconTrophy size={18} class="text-green-500" />
          <span class="text-sm font-semibold text-green-600 dark:text-green-400">
            Mesocycle Complete!
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p class="text-xs text-muted-foreground">All microcycles are done. Great work!</p>
      </CardContent>
    </Card>
  {/if}
{/if}
