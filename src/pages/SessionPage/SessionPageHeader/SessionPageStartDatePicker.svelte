<!--
  @component

  Inline date picker for selecting a session start date. Uses a Calendar inside
  a Popover, following the same pattern as MesocycleConfigCard.
-->
<script lang="ts">
  import { fromDate, getLocalTimeZone } from '@internationalized/date';
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
  const calendarValue = $derived(fromDate(startTime, tz));
  let popoverOpen = $state(false);

  const formattedDate = $derived(
    startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  );
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
        value={calendarValue}
        onValueChange={(value) => {
          popoverOpen = false;
          if (value) {
            onstartTimeChange(value.toDate(tz));
          }
        }}
      />
    </PopoverContent>
  </Popover>
</div>
