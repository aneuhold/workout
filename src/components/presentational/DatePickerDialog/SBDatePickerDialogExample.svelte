<script lang="ts">
  import Button, { Label } from '@smui/button';
  import DatePickerDialog from './DatePickerDialog.svelte';

  let {
    title = 'Pick a date',
    dateIsEndDate = false,
    initialDate,
    startDate,
    endDate,
    onSelected
  }: {
    title?: string;
    dateIsEndDate?: boolean;
    initialDate?: Date;
    startDate?: Date;
    endDate?: Date;
    onSelected?: (date: Date | null) => void;
  } = $props();

  let open = $state(false);
  let selectedDate = $state<Date | null>(null);

  function handleSelected(date: Date | null) {
    selectedDate = date;
    onSelected?.(date);
  }

  function openDialog() {
    open = true;
  }
</script>

<div style="padding: 20px;">
  <Button variant="raised" onclick={openDialog}>
    <Label>Open Date Picker</Label>
  </Button>

  {#if selectedDate}
    <p style="margin-top: 20px;">
      <strong>Selected Date:</strong>
      {selectedDate.toLocaleString()}
    </p>
  {/if}

  <DatePickerDialog
    bind:open
    {title}
    {dateIsEndDate}
    {initialDate}
    {startDate}
    {endDate}
    onSelected={handleSelected}
  />
</div>
