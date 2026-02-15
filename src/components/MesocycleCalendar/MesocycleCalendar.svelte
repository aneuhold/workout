<script lang="ts">
  import type {
    WorkoutExercise,
    WorkoutMesocycle,
    WorkoutMicrocycle,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet
  } from '@aneuhold/core-ts-db-lib';
  import MesocycleCalendarDayCell from './MesocycleCalendarDayCell.svelte';
  import MesocycleCalendarDayDetailDialog from './MesocycleCalendarDayDetailDialog.svelte';
  import MesocycleCalendarDayHeaders from './MesocycleCalendarDayHeaders.svelte';
  import MesocycleCalendarLabelRow from './MesocycleCalendarLabelRow.svelte';
  import type { MesocycleCalendarDayCell as DayCellType } from './mesocycleCalendarTypes';
  import mesocycleCalendarUtils from './mesocycleCalendarUtils';

  let {
    mesocycle,
    microcycles,
    sessions,
    sessionExercises,
    sets,
    exercises
  }: {
    mesocycle: WorkoutMesocycle;
    microcycles: WorkoutMicrocycle[];
    sessions: WorkoutSession[];
    sessionExercises: WorkoutSessionExercise[];
    sets: WorkoutSet[];
    exercises: WorkoutExercise[];
  } = $props();

  const calendarData = $derived(
    mesocycleCalendarUtils.buildCalendarData({
      mesocycle,
      microcycles,
      sessions,
      sessionExercises,
      sets,
      exercises
    })
  );

  const nextSessionDayIndex = $derived.by(() => {
    for (const row of calendarData.weekRows) {
      for (const day of row.days) {
        if (day?.type === 'session' && day.sessions.some((s) => !s.completed)) {
          return day.dayIndex;
        }
      }
    }
    return -1;
  });

  let selectedDay: DayCellType | null = $state(null);
  let dialogOpen = $state(false);

  function handleDayClick(day: DayCellType) {
    selectedDay = day;
    dialogOpen = true;
  }
</script>

<!-- Overflow x is hidden in case the month / cycle text goes out of bounds and starts creating a
 horizontal scrollbar -->
<div class="w-full max-w-md mx-auto p-1 overflow-x-hidden">
  <MesocycleCalendarDayHeaders />

  {#each calendarData.weekRows as row, rowIdx (rowIdx)}
    <div class="mt-1">
      <MesocycleCalendarLabelRow labels={row.labelRow ?? []} />
      <div class="grid grid-cols-7 gap-1">
        {#each row.days as day, colIdx (colIdx)}
          {#if day}
            <MesocycleCalendarDayCell {day} {nextSessionDayIndex} onDayClick={handleDayClick} />
          {:else}
            <div class="min-h-12"></div>
          {/if}
        {/each}
      </div>
    </div>
  {/each}
</div>

<MesocycleCalendarDayDetailDialog
  day={selectedDay}
  bind:open={dialogOpen}
  totalCycles={calendarData.microcycleCount}
/>
