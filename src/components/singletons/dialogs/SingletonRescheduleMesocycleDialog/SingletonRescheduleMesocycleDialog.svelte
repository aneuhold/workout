<!--
  @component

  Singleton dialog for rescheduling a mesocycle to a new start date.
  Shows the current schedule, a calendar picker with disabled dates to prevent
  overlaps, and the projected new end date after picking. Import
  `rescheduleMesocycleDialog` and call `.open()` from anywhere to trigger.
-->
<script lang="ts" module>
  import type { DateValue } from '@internationalized/date';

  type RescheduleMesocycleDialogParams = {
    /** The current start date of the mesocycle. */
    currentStartDate: Date;
    /** The total duration of the mesocycle in calendar days. */
    mesocycleDurationDays: number;
    /** Returns true for dates that should be disabled in the calendar. */
    isDateDisabled: (date: DateValue) => boolean;
    /** Callback invoked when the user confirms the new start date. */
    onReschedule: (newStartDate: Date) => void;
  };

  let dialogOpen = $state(false);
  let params = $state<RescheduleMesocycleDialogParams | null>(null);
  let selectedDate = $state<DateValue | undefined>(undefined);
  let popoverOpen = $state(false);

  export const rescheduleMesocycleDialog = {
    /**
     * Opens the reschedule mesocycle dialog with the given parameters.
     *
     * @param dialogParams Configuration for the dialog content and callbacks.
     */
    open: (dialogParams: RescheduleMesocycleDialogParams) => {
      params = dialogParams;
      selectedDate = undefined;
      popoverOpen = false;
      dialogOpen = true;
    }
  };
</script>

<script lang="ts">
  import { DateService } from '@aneuhold/core-ts-lib';
  import { fromDate, getLocalTimeZone } from '@internationalized/date';
  import { IconCalendarEvent } from '@tabler/icons-svelte';
  import AlertDialog from '$ui/AlertDialog/AlertDialog.svelte';
  import AlertDialogCancel from '$ui/AlertDialog/AlertDialogCancel.svelte';
  import AlertDialogContent from '$ui/AlertDialog/AlertDialogContent.svelte';
  import AlertDialogDescription from '$ui/AlertDialog/AlertDialogDescription.svelte';
  import AlertDialogFooter from '$ui/AlertDialog/AlertDialogFooter.svelte';
  import AlertDialogHeader from '$ui/AlertDialog/AlertDialogHeader.svelte';
  import AlertDialogTitle from '$ui/AlertDialog/AlertDialogTitle.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Calendar from '$ui/Calendar/Calendar.svelte';
  import Popover from '$ui/Popover/Popover.svelte';
  import PopoverContent from '$ui/Popover/PopoverContent.svelte';
  import PopoverTrigger from '$ui/Popover/PopoverTrigger.svelte';

  const tz = getLocalTimeZone();

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const currentStartFormatted = $derived(params ? formatDate(params.currentStartDate) : '');

  const currentEndFormatted = $derived(
    params
      ? formatDate(DateService.addDays(params.currentStartDate, params.mesocycleDurationDays))
      : ''
  );

  const newStartFormatted = $derived(selectedDate ? formatDate(selectedDate.toDate(tz)) : null);

  const newEndFormatted = $derived(
    selectedDate && params
      ? formatDate(DateService.addDays(selectedDate.toDate(tz), params.mesocycleDurationDays))
      : null
  );

  const isDateUnchanged = $derived.by(() => {
    if (!selectedDate || !params) return true;
    const selected = selectedDate.toDate(tz);
    const current = params.currentStartDate;
    return (
      selected.getFullYear() === current.getFullYear() &&
      selected.getMonth() === current.getMonth() &&
      selected.getDate() === current.getDate()
    );
  });

  const canReschedule = $derived(selectedDate != null && !isDateUnchanged);

  // Navigate the calendar to the current start date's month when the dialog opens.
  let calendarPlaceholder = $state<DateValue | undefined>(undefined);

  $effect(() => {
    if (params) {
      calendarPlaceholder = fromDate(params.currentStartDate, tz);
    }
  });

  /**
   * Confirms the reschedule and closes the dialog.
   */
  function handleReschedule() {
    if (!params || !selectedDate) return;
    params.onReschedule(selectedDate.toDate(tz));
    dialogOpen = false;
  }
</script>

<AlertDialog bind:open={dialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Reschedule Mesocycle</AlertDialogTitle>
      <AlertDialogDescription>
        Current schedule: <strong>{currentStartFormatted}</strong> –
        <strong>{currentEndFormatted}</strong>. Pick a new start date to shift all sessions.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <div class="flex flex-col items-start gap-1.5">
      <Popover bind:open={popoverOpen}>
        <PopoverTrigger>
          <Button variant="outline">
            <IconCalendarEvent size={16} />
            {newStartFormatted ?? 'Pick a start date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent class="p-0">
          <Calendar
            type="single"
            bind:value={selectedDate}
            bind:placeholder={calendarPlaceholder}
            isDateDisabled={params?.isDateDisabled}
            onValueChange={() => {
              popoverOpen = false;
            }}
          />
        </PopoverContent>
      </Popover>
      {#if newEndFormatted}
        <span class="text-xs text-muted-foreground">Projected end: {newEndFormatted}</span>
      {/if}
    </div>

    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <Button onclick={handleReschedule} disabled={!canReschedule}>Reschedule</Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
