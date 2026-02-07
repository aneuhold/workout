<script lang="ts">
  import InfoIcon from '$components/InfoIcon.svelte';
  import InputBox from '$components/presentational/InputBox/InputBox.svelte';
  import { userConfig } from '$stores/local/userConfig/userConfig';
</script>

<div class="titleContainer">
  <span class="mdc-typography--subtitle1 title">Auto Task Deletion Days</span>
  <InfoIcon title="Auto Task Deletion Settings">
    <p>
      Tasks will be auto-deleted after the specified number of days as long as they meet <b>all</b> the
      following conditions:
    </p>
    <ul>
      <li>The task is completed</li>
      <li>The task has no parent task</li>
      <li>The task is not recurring</li>
      <li>You are the owner of the task (or it is not shared)</li>
      <li>The last modified date on the task is older than the specified number of days</li>
    </ul>
    <p>
      Note that the auto-deletion days can only be set to a minimum of 5, and a maximum of 90 days.
    </p>
  </InfoIcon>
</div>
<InputBox
  inputType="number"
  inputValue={$userConfig.config.autoTaskDeletionDays}
  bind:onBlurValue={$userConfig.config.autoTaskDeletionDays}
  min={5}
  max={90}
/>

<style>
  .titleContainer {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
</style>
