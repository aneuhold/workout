<script lang="ts">
  import { type DashboardTask, RecurrenceEffect } from '@aneuhold/core-ts-db-lib';
  import Checkbox from '@smui/checkbox';
  import { triggerConfetti } from '$components/singletons/Confetti/Confetti.svelte';
  import { confirmationDialog } from '$components/singletons/dialogs/SingletonConfirmationDialog/SingletonConfirmationDialog.svelte';
  import { snackbar } from '$components/singletons/SingletonSnackbar.svelte';
  import taskMapService from '$services/Task/TaskMapService/TaskMapService';
  import ClickableDiv from '../presentational/ClickableDiv.svelte';

  let {
    task
  }: {
    task: DashboardTask;
  } = $props();

  // X and Y of the most recent click event for use in confetti
  let clickX = 0;
  let clickY = 0;

  let preventDefault = $derived(
    !task.parentRecurringTaskInfo &&
      !task.completed &&
      task.recurrenceInfo &&
      task.recurrenceInfo.recurrenceEffect === RecurrenceEffect.rollOnCompletion
  );

  function handleCheckboxClick(event?: MouseEvent) {
    if (event) {
      clickX = event.clientX;
      clickY = event.clientY;
    }
    if (preventDefault) {
      confirmationDialog.open({
        title: 'Complete task?',
        message: 'Completing this task will cause it to update according to the recurrence info.',
        onConfirm: handleConfirm
      });
    } else {
      handleToggle();
    }
  }

  function handleConfirm() {
    handleToggle();
    snackbar.success('Task completed then updated 🎉');
  }

  function handleToggle() {
    if (!task.completed) {
      triggerConfetti(clickX, clickY);
    }
    taskMapService.toggleTaskCompleted(task);
  }
</script>

<ClickableDiv clickAction={handleCheckboxClick}>
  <Checkbox
    checked={task.completed}
    touch
    onclick={(event) => {
      if (preventDefault) {
        event.preventDefault();
      }
    }}
  />
</ClickableDiv>
