<!--
  @component

  Card displaying a completed (past) mesocycle with title, cycle type badge,
  date range, and session count.
-->
<script lang="ts">
  import type {
    WorkoutMesocycle,
    WorkoutMicrocycle,
    WorkoutSession
  } from '@aneuhold/core-ts-db-lib';
  import { IconCalendar, IconChevronRight } from '@tabler/icons-svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Card from '$ui/Card/Card.svelte';
  import { formatCycleType } from './mesocyclesPageUtils';

  let {
    mesocycle,
    sortedMicrocycles,
    sessions
  }: {
    mesocycle: WorkoutMesocycle;
    /** Must be sorted by `startDate` ascending. */
    sortedMicrocycles: WorkoutMicrocycle[];
    sessions: WorkoutSession[];
  } = $props();

  const title = $derived(mesocycle.title || 'Untitled Mesocycle');

  const dateRange = $derived.by(() => {
    if (sortedMicrocycles.length === 0) return '';
    const start = new Date(sortedMicrocycles[0].startDate);
    const end = mesocycle.completedDate
      ? new Date(mesocycle.completedDate)
      : new Date(sortedMicrocycles[sortedMicrocycles.length - 1].endDate);
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  });

  const completedCount = $derived(sessions.filter((s) => s.complete).length);
  const totalCount = $derived(sessions.length);
</script>

<Card size="sm">
  <div class="flex items-center gap-3 px-3 py-1">
    <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
      <IconCalendar size={18} class="text-muted-foreground" />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span class="truncate text-sm font-medium">{title}</span>
        <Badge variant="outline" class="shrink-0">{formatCycleType(mesocycle.cycleType)}</Badge>
      </div>
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{dateRange}</span>
        {#if dateRange && totalCount > 0}
          <span>·</span>
        {/if}
        {#if totalCount > 0}
          <span>{completedCount}/{totalCount} sessions</span>
        {/if}
      </div>
    </div>

    <IconChevronRight size={16} class="shrink-0 text-muted-foreground" />
  </div>
</Card>
