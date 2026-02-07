<script lang="ts">
  import Select, { Option } from '@smui/select';
  import WeekdaySegmentedButton from '$components/WeekdaySegmentedButton.svelte';

  let {
    weekDay = $bindable(),
    weekOfMonth = $bindable(),
    disabled = false
  }: {
    weekDay: number;
    weekOfMonth: number | 'last';
    disabled?: boolean;
  } = $props();
</script>

<div class="container">
  <div class="container">
    <span>Every</span>
    <Select {disabled} bind:value={weekOfMonth}>
      <Option value={1}>1st</Option>
      <Option value={2}>2nd</Option>
      <Option value={3}>3rd</Option>
      <Option value={4}>4th</Option>
      <Option value="last">Last</Option>
    </Select>
  </div>
  <WeekdaySegmentedButton {disabled} bind:weekDaySetOrChoice={weekDay} />
  <span>of the month</span>
</div>

<style>
  .container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
</style>
