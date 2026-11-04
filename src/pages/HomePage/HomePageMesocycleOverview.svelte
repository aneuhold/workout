<!--
  @component

  Condensed mesocycle header showing title, cycle type, and microcycle progress.
-->
<script lang="ts">
  import type { WorkoutMesocycle, WorkoutMicrocycle } from '@aneuhold/core-ts-db-lib';
  import { WorkoutMesocycleService } from '@aneuhold/core-ts-db-lib';
  import { formatCycleType } from '$pages/MesocyclesPage/mesocyclesPageUtils';
  import Badge from '$ui/Badge/Badge.svelte';
  import Progress from '$ui/Progress/Progress.svelte';

  let {
    mesocycle,
    sortedMicrocycles
  }: {
    mesocycle: WorkoutMesocycle;
    sortedMicrocycles: WorkoutMicrocycle[];
  } = $props();

  const title = $derived(mesocycle.title || 'Untitled Mesocycle');
  const totalCycles = $derived(sortedMicrocycles.length);

  const currentCycleNumber = $derived.by(() => {
    const currentMicrocycle = WorkoutMesocycleService.getCurrentMicrocycle(sortedMicrocycles);
    return currentMicrocycle ? sortedMicrocycles.indexOf(currentMicrocycle) + 1 : totalCycles;
  });

  const progressValue = $derived(totalCycles > 0 ? (currentCycleNumber / totalCycles) * 100 : 0);
</script>

<a href="/mesocycle?mesocycleId={mesocycle._id}" class="block">
  <div class="flex items-center gap-2">
    <span class="text-sm font-semibold">{title}</span>
    <Badge variant="secondary">{formatCycleType(mesocycle.cycleType)}</Badge>
  </div>
  <span class="text-xs text-muted-foreground">
    Microcycle {currentCycleNumber} of {totalCycles}
  </span>
  <Progress value={progressValue} />
</a>
