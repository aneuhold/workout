<script lang="ts">
  import { CalendarDate, type DateValue, getLocalTimeZone, today } from '@internationalized/date';
  import type { ComponentProps } from 'svelte';
  import Calendar from './Calendar.svelte';

  let {
    captionLayout = 'dropdown',
    numberOfMonths = 1
  }: {
    captionLayout?: ComponentProps<typeof Calendar>['captionLayout'];
    numberOfMonths?: number;
  } = $props();

  let value = $state<DateValue | undefined>(today(getLocalTimeZone()));
  let placeholder = $state<DateValue>(new CalendarDate(2024, 1, 1));
</script>

<div class="border rounded-lg inline-block shadow-sm">
  <Calendar bind:value bind:placeholder {captionLayout} {numberOfMonths} type="single" />
</div>
