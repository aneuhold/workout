<!--
  @component

  Monthly calendar view displaying all workout sessions — both mesocycle-based and free-form.
  Uses the shadcn Calendar in hideGrid mode as the month/year picker with prev/next navigation.
  Sessions are displayed in a 7-column day grid below the picker.
-->
<script lang="ts">
  import type {
    WorkoutExercise,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet
  } from '@aneuhold/core-ts-db-lib';
  import { CalendarDate, type DateValue, getLocalTimeZone, today } from '@internationalized/date';
  import Calendar from '$ui/Calendar/Calendar.svelte';
  import type { WorkoutCalendarDayCellVisual } from '../shared/WorkoutCalendarDayCell.svelte';
  import WorkoutCalendarDayCell from '../shared/WorkoutCalendarDayCell.svelte';
  import WorkoutCalendarDayDetailDialog from '../shared/WorkoutCalendarDayDetailDialog.svelte';
  import WorkoutCalendarDayHeaders from '../shared/WorkoutCalendarDayHeaders.svelte';
  import type { WorkoutSessionCalendarDayCell } from './workoutSessionCalendarTypes';
  import workoutSessionCalendarUtils from './workoutSessionCalendarUtils';

  let {
    sessions,
    sessionExercises,
    sets,
    exercises
  }: {
    /** All sessions to consider (the component filters to the visible month). */
    sessions: WorkoutSession[];
    /** Session exercises for loaded sessions. */
    sessionExercises: WorkoutSessionExercise[];
    /** Sets for loaded sessions. */
    sets: WorkoutSet[];
    /** Exercise documents for name lookups. */
    exercises: WorkoutExercise[];
  } = $props();

  const initial = today(getLocalTimeZone());
  let pickerPlaceholder = $state<DateValue>(new CalendarDate(initial.year, initial.month, 1));
  let selectedDay = $state<WorkoutSessionCalendarDayCell | null>(null);
  let dialogOpen = $state(false);

  const monthGrid = $derived(
    workoutSessionCalendarUtils.buildMonthGrid({
      year: pickerPlaceholder.year,
      month: pickerPlaceholder.month - 1, // DateValue is 1-based; utils are 0-based
      sessions,
      sessionExercises,
      sets,
      exercises
    })
  );

  /**
   * Computes the visual variant for a session calendar day cell.
   * Precedence: outside-month → today → completed → session → empty.
   *
   * @param day - The day cell to compute the visual for
   */
  function computeVisual(day: WorkoutSessionCalendarDayCell): WorkoutCalendarDayCellVisual {
    if (day.isOutsideMonth) return 'outside-month';
    if (day.isToday) return 'today';
    if (day.type === 'session') {
      const allCompleted = day.sessions.every((s) => s.completed);
      if (allCompleted) return 'completed';
      return 'session';
    }
    return 'empty';
  }

  /**
   * Computes the description object for the detail dialog based on the selected day's sessions.
   *
   * @param day - The selected day cell
   */
  function computeDescription(day: WorkoutSessionCalendarDayCell): {
    primary: string;
    secondary: string;
  } {
    const count = day.sessions.length;
    const primary = `${count} session${count !== 1 ? 's' : ''}`;
    const allCompleted = day.sessions.every((s) => s.completed);
    const allIncomplete = day.sessions.every((s) => !s.completed);
    let secondary: string;
    if (allCompleted) {
      secondary = 'Completed';
    } else if (allIncomplete) {
      secondary = 'Projected targets';
    } else {
      secondary = 'In Progress';
    }
    return { primary, secondary };
  }

  /**
   * Handles a user tapping a clickable day cell.
   *
   * @param day - The day cell that was clicked
   */
  function handleDayClick(day: WorkoutSessionCalendarDayCell) {
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

  const dialogDescription = $derived(
    selectedDay ? computeDescription(selectedDay) : { primary: '', secondary: '' }
  );
</script>

<div class="w-full max-w-md mx-auto p-1">
  <Calendar
    type="single"
    captionLayout="dropdown"
    hideGrid
    bind:placeholder={pickerPlaceholder}
    class="w-full flex justify-center"
  />
  <WorkoutCalendarDayHeaders />
  {#each monthGrid.weekRows as row, rowIdx (rowIdx)}
    <div class="grid grid-cols-7 gap-1 mt-1">
      {#each row as day, colIdx (colIdx)}
        <WorkoutCalendarDayCell
          dateLabel={day.date.getDate()}
          sessions={day.sessions}
          visual={computeVisual(day)}
          isClickable={day.sessions.length > 0 && !day.isOutsideMonth}
          onDayClick={() => handleDayClick(day)}
        />
      {/each}
    </div>
  {/each}
</div>

<WorkoutCalendarDayDetailDialog
  formattedDate={dialogFormattedDate}
  description={dialogDescription}
  sessions={selectedDay?.sessions ?? []}
  showSourceLabels={true}
  bind:open={dialogOpen}
/>
