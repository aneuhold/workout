<!--
  @component

  Condensed mesocycle header showing title, cycle type, and week progress.
-->
<script lang="ts">
  import type {
    WorkoutMesocycle,
    WorkoutMicrocycle,
    WorkoutSession
  } from '@aneuhold/core-ts-db-lib';
  import { formatCycleType } from '$pages/MesocyclesPage/mesocyclesPageUtils';
  import Badge from '$ui/Badge/Badge.svelte';
  import Progress from '$ui/Progress/Progress.svelte';

  let {
    mesocycle,
    sortedMicrocycles,
    sessions
  }: {
    mesocycle: WorkoutMesocycle;
    sortedMicrocycles: WorkoutMicrocycle[];
    sessions: WorkoutSession[];
  } = $props();

  const title = $derived(mesocycle.title || 'Untitled Mesocycle');
  const totalCycles = $derived(sortedMicrocycles.length);

  const currentCycleNumber = $derived.by(() => {
    const firstIncomplete = sessions.find((s) => !s.complete);
    if (!firstIncomplete?.workoutMicrocycleId) {
      return sortedMicrocycles.length;
    }
    const cycleIndex = sortedMicrocycles.findIndex(
      (mc) => mc._id === firstIncomplete.workoutMicrocycleId
    );
    return cycleIndex >= 0 ? cycleIndex + 1 : sortedMicrocycles.length;
  });

  const progressValue = $derived(totalCycles > 0 ? (currentCycleNumber / totalCycles) * 100 : 0);
</script>

<a href="/mesocycle?mesocycleId={mesocycle._id}" class="block">
  <div class="flex items-center gap-2">
    <span class="text-sm font-semibold">{title}</span>
    <Badge variant="secondary">{formatCycleType(mesocycle.cycleType)}</Badge>
  </div>
  <span class="text-xs text-muted-foreground">
    Week {currentCycleNumber} of {totalCycles}
  </span>
  <Progress value={progressValue} />
</a>
