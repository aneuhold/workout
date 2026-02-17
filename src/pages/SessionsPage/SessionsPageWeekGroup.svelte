<!--
  @component

  Collapsible week group showing sessions for a single microcycle.
  Completed weeks default to collapsed; current and future weeks are expanded.
-->
<script lang="ts">
  import type {
    WorkoutMicrocycle,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet
  } from '@aneuhold/core-ts-db-lib';
  import { IconChevronDown, IconChevronRight } from '@tabler/icons-svelte';
  import SessionCard from '$components/SessionCard/SessionCard.svelte';
  import { SessionStatus } from '$components/SessionCard/sessionCardTypes';
  import { getSessionStatus } from '$components/SessionCard/sessionCardUtils';
  import microcycleMapService from '$services/documentMapServices/microcycleMapService.svelte';
  import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';

  let {
    microcycle,
    weekNumber,
    isDeload,
    inProgressSessionId,
    nextUpSessionId
  }: {
    microcycle: WorkoutMicrocycle;
    weekNumber: number;
    isDeload: boolean;
    inProgressSessionId: string | null;
    nextUpSessionId: string | null;
  } = $props();

  const sessions = $derived(microcycleMapService.getOrderedSessionsForMicrocycle(microcycle));

  const completedCount = $derived(sessions.filter((s) => s.complete).length);
  const allComplete = $derived(completedCount === sessions.length && sessions.length > 0);
  const hasReview = $derived(
    allComplete && sessions.some((s) => getStatus(s) === SessionStatus.Review)
  );

  let expanded = $derived(!allComplete || hasReview);

  const weekLabel = $derived(isDeload ? 'Deload' : `Week ${weekNumber}`);

  const dateRange = $derived.by(() => {
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    const start = new Date(microcycle.startDate);
    const end = new Date(microcycle.endDate);
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  });

  function getExercisesForSession(session: WorkoutSession): WorkoutSessionExercise[] {
    return sessionMapService.getOrderedSessionExercisesForSession(session);
  }

  function getSetsForSession(session: WorkoutSession): WorkoutSet[] {
    return sessionMapService.getOrderedSetsForSession(session);
  }

  function getStatus(session: WorkoutSession): SessionStatus {
    const exercises = getExercisesForSession(session);
    const sets = getSetsForSession(session);
    return getSessionStatus(
      session,
      sets,
      exercises,
      session._id === inProgressSessionId,
      session._id === nextUpSessionId
    );
  }
</script>

<div class="flex flex-col gap-2">
  <button class="flex items-center gap-2 text-left" onclick={() => (expanded = !expanded)}>
    {#if expanded}
      <IconChevronDown size={16} class="shrink-0 text-muted-foreground" />
    {:else}
      <IconChevronRight size={16} class="shrink-0 text-muted-foreground" />
    {/if}
    <div class="flex flex-1 items-center gap-2">
      <span class="text-sm font-medium">{weekLabel}</span>
      <span class="text-xs text-muted-foreground">{dateRange}</span>
    </div>
    {#if !expanded}
      <span class="text-xs text-muted-foreground">{completedCount}/{sessions.length}</span>
    {/if}
  </button>

  {#if expanded}
    <div class="flex flex-col gap-2 pl-6">
      {#each sessions as session (session._id)}
        <SessionCard
          {session}
          status={getStatus(session)}
          sessionExercises={getExercisesForSession(session)}
          sets={getSetsForSession(session)}
        />
      {/each}
    </div>
  {/if}
</div>
