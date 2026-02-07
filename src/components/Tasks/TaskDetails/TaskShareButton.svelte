<script lang="ts">
  import { type DashboardTask } from '@aneuhold/core-ts-db-lib';
  import Button, { Icon } from '@smui/button';
  import { goto } from '$app/navigation';
  import { taskSharingDialog } from '$components/singletons/dialogs/SingletonTaskSharingDialog/SingletonTaskSharingDialog.svelte';
  import TaskUtilityService from '$services/Task/TaskUtilityService';
  import { userConfig } from '$stores/local/userConfig/userConfig';

  let {
    task
  }: {
    task: DashboardTask;
  } = $props();

  let sharingDisabled = $derived(task.userId !== $userConfig.config.userId);
  let finalParentId = $derived(TaskUtilityService.findParentIdWithSameSharedWith(task));
  let taskId = $derived(task._id);
  let buttonText = $derived(
    finalParentId === taskId || sharingDisabled ? 'Share' : 'Configure Sharing'
  );

  function handleClick() {
    if (finalParentId === taskId) {
      taskSharingDialog.open(taskId);
    } else {
      goto(TaskUtilityService.getTaskRoute(finalParentId, true));
    }
  }
</script>

<Button
  variant="raised"
  class="secondary-button"
  color="secondary"
  disabled={sharingDisabled}
  onclick={handleClick}
>
  <Icon class="material-icons">share</Icon>
  {buttonText}
</Button>
