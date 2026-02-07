<script>
  import InfoIcon from '$components/InfoIcon.svelte';
</script>

<InfoIcon title="Recurring Tasks">
  <div class="content">
    <div class="section">
      <b>Frequency</b>
      <span>The frequency in which the recurrence effect will take place.</span>
      <span>
        Note that a task will never recur until the start date is in the past (includes current
        day), or the due date is in the future (also includes current day).
      </span>
    </div>
    <div class="section">
      <b>Basis</b>
      <span>
        The recurrence basis is the basis of date movement for a recurring task. For example, if a
        task has the following properties:
        <ul>
          <li>The frequency is every two weeks</li>
          <li>The basis is "Start Date"</li>
          <li>The start date is set to a Monday</li>
          <li>The due date is set to the following Tuesday</li>
        </ul>
        The recurrence effect will take place every other Monday.
      </span>
      <span> In order for a task to recur, it must have a start date and / or a due date. </span>
    </div>
    <div class="section">
      <b>Effect</b>
      <ul>
        <li>
          <b>Roll On Basis</b>: Automatically moves the task forward, based on the frequency, when
          the basis triggers
        </li>
        <li>
          <b>Roll On Completion</b>: Moves the task forward from the completed date and doesn't
          reset the task when the basis triggers.
        </li>
        <li>
          <b>Stack</b>: When the recurrence basis triggers, and the current task isn't completed,
          makes a duplicate task and disables recurring on the original task. This means that
          multiple of the same task can be present at the same time, but only the latest will be
          recurring.
        </li>
      </ul>
    </div>
  </div>
</InfoIcon>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .section {
    display: flex;
    flex-direction: column;
  }
</style>
