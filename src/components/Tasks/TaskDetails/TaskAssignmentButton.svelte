<script lang="ts">
  import { type DashboardTask } from '@aneuhold/core-ts-db-lib';
  import Button, { Icon } from '@smui/button';
  import { taskAssignmentDialog } from '$components/singletons/dialogs/SingletonTaskAssignmentDialog/SingletonTaskAssignmentDialog.svelte';

  let { task }: { task: DashboardTask } = $props();

  function handleClick() {
    taskAssignmentDialog.open(task._id);
  }
</script>

<!--The assignedTo gets cleared when
no one is being shared with, or the current assignee is unshared with in the
SingletonTaskSharingDialog component.-->
<Button variant="raised" class="secondary-button" color="secondary" onclick={handleClick}>
  <Icon class="material-icons">assignment_ind</Icon>
  Assign
</Button>
