<!--
  @component

  Hero card at the top of the home page. Orchestrates all "next action" states:
  continue session, start session, complete microcycle, start mesocycle, or
  complete mesocycle.
-->
<script lang="ts">
  import { IconChevronRight, IconSparkles, IconTrophy } from '@tabler/icons-svelte';
  import { countCompletedSets } from '$components/SessionCard/sessionCardUtils';
  import { triggerConfetti } from '$components/singletons/Confetti/Confetti.svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import Progress from '$ui/Progress/Progress.svelte';
  import { HeroCardAction, type HeroCardState } from './heroCardUtils';

  let {
    state,
    onCompleteMicrocycle,
    onStartMesocycle
  }: {
    state: HeroCardState;
    onCompleteMicrocycle?: () => void;
    onStartMesocycle?: (e: MouseEvent) => void;
  } = $props();

  // Session-related derivations (only used for ContinueSession / StartSession)
  const sessionState = $derived(
    state.action === HeroCardAction.ContinueSession || state.action === HeroCardAction.StartSession
      ? state
      : null
  );

  const totalSets = $derived(sessionState?.sets.length ?? 0);
  const completed = $derived(sessionState ? countCompletedSets(sessionState.sets) : 0);
  const percent = $derived(totalSets > 0 ? Math.round((completed / totalSets) * 100) : 0);

  const exerciseNames = $derived(
    sessionState?.sessionExercises.map((se) => {
      const exercise = exerciseMapService.getDoc(se.workoutExerciseId);
      return exercise?.exerciseName ?? 'Unknown';
    }) ?? []
  );

  const isInProgress = $derived(state.action === HeroCardAction.ContinueSession);
</script>

{#if state.action === HeroCardAction.ContinueSession || state.action === HeroCardAction.StartSession}
  <Card class="ring-primary/30 ring-2">
    <CardHeader>
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold">
          {isInProgress ? 'Continue Session' : 'Next Up'}
        </span>
        <Button size="sm" href="/session?sessionId={state.session._id}">
          {isInProgress ? 'Continue' : 'Start Session'}
          <IconChevronRight size={14} />
        </Button>
      </div>
    </CardHeader>
    <CardContent class="flex flex-col gap-2">
      <span class="text-sm font-medium">{state.session.title}</span>
      {#if isInProgress}
        <Progress value={percent} max={100} class="h-1.5" />
        <span class="text-xs text-muted-foreground">{completed}/{totalSets} sets completed</span>
      {:else}
        <div class="text-xs text-muted-foreground">
          {sessionState?.sessionExercises.length ?? 0} exercises · {totalSets} sets
        </div>
        <div class="flex flex-wrap gap-1">
          {#each exerciseNames as name (name)}
            <Badge variant="outline" class="text-xs">{name}</Badge>
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>
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
          Fill in your session reviews before advancing to the next microcycle. This helps optimize
          your upcoming training.
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
            onCompleteMicrocycle?.();
          }}
        >
          Advance to Next Microcycle
          <IconChevronRight size={14} />
        </Button>
      {/if}
    </CardContent>
  </Card>
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
      <Button size="sm" onclick={onStartMesocycle}>
        Start Mesocycle
        <IconChevronRight size={14} />
      </Button>
    </CardContent>
  </Card>
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
