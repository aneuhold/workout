<script lang="ts">
  import { DateService } from '@aneuhold/core-ts-lib';
  import Chip, { LeadingIcon, Set, Text } from '@smui/chips';

  let {
    dateType,
    date,
    onclick
  }: {
    dateType: 'due' | 'start';
    date?: Date | null;
    /**
     * Callback fired when the chip is clicked.
     */
    onclick?: () => void;
  } = $props();

  let dateTitle = $derived(dateType === 'due' ? 'Due Date' : 'Start Date');
  let dateValue = $derived(date ? DateService.getAutoDateString(date) : 'Not Set');
</script>

<div class="container">
  <span class={`mdc-typography--body2${date ? '' : ' dimmed-color'}`}>{dateTitle}</span>
  <Set chips={['one']}>
    {#snippet chip(chip)}
      <Chip
        {chip}
        class={date ? '' : 'dimmed-color'}
        shouldRemoveOnTrailingIconClick={false}
        {onclick}
      >
        <LeadingIcon class="material-icons">event</LeadingIcon>
        <Text>{dateValue}</Text>
      </Chip>
    {/snippet}
  </Set>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
