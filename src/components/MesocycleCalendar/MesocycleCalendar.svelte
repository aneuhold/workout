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
  import type {
    MesocycleCalendarDayCell as DayCellType,
    MesocycleCalendarMode
  } from './mesocycleCalendarTypes';
  import mesocycleCalendarUtils from './mesocycleCalendarUtils';

  let {
    mesocycle,
    microcycles,
    sessions,
    sessionExercises,
    sets,
    exercises,
    mode
  }: {
    mesocycle: WorkoutMesocycle;
    microcycles: WorkoutMicrocycle[];
    sessions: WorkoutSession[];
    sessionExercises: WorkoutSessionExercise[];
    sets: WorkoutSet[];
    exercises: WorkoutExercise[];
    mode: MesocycleCalendarMode;
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

  const currentCycleNumber = $derived(
    mesocycleCalendarUtils.getCurrentCycleNumber(microcycles, sessions)
  );

  let selectedDay: DayCellType | null = $state(null);
  let dialogOpen = $state(false);

  function handleDayClick(day: DayCellType) {
    selectedDay = day;
    dialogOpen = true;
  }
</script>

<div class="w-full max-w-md mx-auto">
  <MesocycleCalendarDayHeaders />

  {#each calendarData.weekRows as row, rowIdx (rowIdx)}
    {#if row.labelRow}
      <MesocycleCalendarLabelRow labels={row.labelRow} />
    {/if}
    <div class="grid grid-cols-7 gap-1">
      {#each row.days as day, colIdx (colIdx)}
        {#if day}
          <MesocycleCalendarDayCell {day} {mode} {currentCycleNumber} onDayClick={handleDayClick} />
        {:else}
          <div class="min-h-12"></div>
        {/if}
      {/each}
    </div>
  {/each}
</div>

<MesocycleCalendarDayDetailDialog
  day={selectedDay}
  bind:open={dialogOpen}
  totalCycles={calendarData.microcycleCount}
/>
