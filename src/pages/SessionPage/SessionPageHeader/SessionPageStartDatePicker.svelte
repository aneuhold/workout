<!--
  @component

  Inline date picker for selecting a session start date. Uses a Calendar inside
  a Popover, following the same pattern as MesocycleConfigCard.
-->
<script lang="ts">
  import { type DateValue, fromDate, getLocalTimeZone } from '@internationalized/date';
  import { IconCalendar } from '@tabler/icons-svelte';
  import Button from '$ui/Button/Button.svelte';
  import Calendar from '$ui/Calendar/Calendar.svelte';
  import Popover from '$ui/Popover/Popover.svelte';
  import PopoverContent from '$ui/Popover/PopoverContent.svelte';
  import PopoverTrigger from '$ui/Popover/PopoverTrigger.svelte';

  let {
    startTime,
    onstartTimeChange
  }: {
    startTime: Date;
    onstartTimeChange: (date: Date) => void;
  } = $props();

  const tz = getLocalTimeZone();
  let calendarValue = $state<DateValue | undefined>(undefined);
  let popoverOpen = $state(false);

  // Initialize calendarValue from the startTime prop on first use.
  // Uses $effect.pre so it runs before the DOM update.
  $effect.pre(() => {
    if (!calendarValue) {
      calendarValue = fromDate(startTime, tz);
    }
  });

  const formattedDate = $derived(
    startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  );

  $effect(() => {
    if (calendarValue) {
      onstartTimeChange(calendarValue.toDate(tz));
    }
  });
</script>

<div class="flex flex-col items-start gap-1">
  <span class="text-xs text-muted-foreground">Start Date</span>
  <Popover bind:open={popoverOpen}>
    <PopoverTrigger>
      <Button variant="outline" size="sm">
        <IconCalendar size={14} />
        {formattedDate}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="p-0">
      <Calendar
        type="single"
        bind:value={calendarValue}
        onValueChange={() => {
          popoverOpen = false;
        }}
      />
    </PopoverContent>
  </Popover>
</div>
