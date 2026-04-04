<!--
  @component

  Renders a workout mesocycle as a scrollable 7-column calendar grid.
  Displays all days across all microcycles with session status indicators,
  cycle labels, and month boundary labels.
-->
<script lang="ts">
  import type {
    WorkoutExercise,
    WorkoutMesocycle,
    WorkoutMicrocycle,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet
  } from '@aneuhold/core-ts-db-lib';
  import type { WorkoutCalendarDayCellVisual } from '../shared/WorkoutCalendarDayCell.svelte';
  import WorkoutCalendarDayCell from '../shared/WorkoutCalendarDayCell.svelte';
  import WorkoutCalendarDayDetailDialog from '../shared/WorkoutCalendarDayDetailDialog.svelte';
  import WorkoutCalendarDayHeaders from '../shared/WorkoutCalendarDayHeaders.svelte';
  import WorkoutMesocycleCalendarLabelRow from './WorkoutMesocycleCalendarLabelRow.svelte';
  import type { WorkoutMesocycleCalendarDayCell as DayCellType } from './workoutMesocycleCalendarTypes';
  import workoutMesocycleCalendarUtils from './workoutMesocycleCalendarUtils';

  let {
    mesocycle,
    microcycles,
    sessions,
    sessionExercises,
    sets,
    exercises,
    lastCycleIsDeload = true
  }: {
    mesocycle: WorkoutMesocycle;
    microcycles: WorkoutMicrocycle[];
    sessions: WorkoutSession[];
    sessionExercises: WorkoutSessionExercise[];
    sets: WorkoutSet[];
    exercises: WorkoutExercise[];
    /** When false, the last microcycle is not labelled as a deload. */
    lastCycleIsDeload?: boolean;
  } = $props();

  const calendarData = $derived(
    workoutMesocycleCalendarUtils.buildCalendarData({
      mesocycle,
      microcycles,
      sessions,
      sessionExercises,
      sets,
      exercises,
      lastCycleIsDeload
    })
  );

  let selectedDay = $state<DayCellType | null>(null);
  let dialogOpen = $state(false);

  /**
   * Computes the visual variant for a mesocycle day cell.
   * Precedence: rest → today → completed → session → empty.
   *
   * @param day - The day cell to compute the visual for
   */
  function computeVisual(day: DayCellType): WorkoutCalendarDayCellVisual {
    if (day.type === 'rest') return 'rest';
    const now = new Date();
    const isToday =
      day.date.getFullYear() === now.getFullYear() &&
      day.date.getMonth() === now.getMonth() &&
      day.date.getDate() === now.getDate();
    if (isToday) return 'today';
    if (day.type === 'session') {
      const allCompleted = day.sessions.every((s) => s.completed);
      if (allCompleted) return 'completed';
      return 'session';
    }
    return 'empty';
  }

  /**
   * Handles a user tapping a clickable day cell.
   *
   * @param day - The day cell that was clicked
   */
  function handleDayClick(day: DayCellType) {
    selectedDay = day;
    dialogOpen = true;
  }

  const dialogFormattedDate = $derived(
    selectedDay
      ? selectedDay.date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      : ''
  );

  const dialogDescription = $derived.by(() => {
    if (!selectedDay) return { primary: '', secondary: '' };
    const primary = selectedDay.isDeload
      ? 'Deload'
      : `Cycle ${selectedDay.cycleNumber} of ${calendarData.microcycleCount}`;
    const daySessions = selectedDay.sessions;
    if (daySessions.length === 0) return { primary, secondary: '' };
    const allCompleted = daySessions.every((s) => s.completed);
    const allIncomplete = daySessions.every((s) => !s.completed);
    let secondary: string;
    if (allCompleted) {
      secondary = 'Completed';
    } else if (allIncomplete) {
      secondary = 'Projected targets';
    } else {
      secondary = 'Session details';
    }
    return { primary, secondary };
  });
</script>

<!-- Overflow x is hidden in case the month / cycle text goes out of bounds and starts creating a
 horizontal scrollbar -->
<div class="w-full max-w-md mx-auto p-1 overflow-x-hidden">
  <WorkoutCalendarDayHeaders />

  {#each calendarData.weekRows as row, rowIdx (rowIdx)}
    <div class="mt-1">
      <WorkoutMesocycleCalendarLabelRow labels={row.labelRow ?? []} />
      <div class="grid grid-cols-7 gap-1">
        {#each row.days as day, colIdx (colIdx)}
          {#if day}
            <WorkoutCalendarDayCell
              dateLabel={day.date.getDate()}
              sessions={day.sessions}
              visual={computeVisual(day)}
              isClickable={day.type === 'session'}
              onDayClick={() => handleDayClick(day)}
              accentLeft={day.isCycleStart}
            />
          {:else}
            <div class="min-h-12"></div>
          {/if}
        {/each}
      </div>
    </div>
  {/each}
</div>

<WorkoutCalendarDayDetailDialog
  formattedDate={dialogFormattedDate}
  description={dialogDescription}
  sessions={selectedDay?.sessions ?? []}
  showSourceLabels={false}
  bind:open={dialogOpen}
/>
