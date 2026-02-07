<!--
@component

Info about subtasks within a task row.
-->
<script lang="ts">
  import { type DashboardTask } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import taskMapService from '$services/Task/TaskMapService/TaskMapService';
  import { currentUserId } from '$stores/derived/currentUserId';

  let {
    allChildrenIds
  }: {
    allChildrenIds: UUID[];
  } = $props();

  let allChildTasks = $derived(
    allChildrenIds.map((id) => taskMapService.mapState[id]) as DashboardTask[]
  );
  let allCompletedTasks = $derived(allChildTasks.filter((task) => task.completed));
  let allIncompleteTasks = $derived(allChildTasks.filter((task) => !task.completed));
  let allIncompleteTasksAssignedToMe = $derived(
    allIncompleteTasks.filter((task) => task.assignedTo === $currentUserId)
  );
</script>

<!--Left at the root so that the parent can style it-->
<span>
  {allChildrenIds.length} child task{allChildrenIds.length > 1 ? 's' : ''}
</span>
<ul class="subTasksInfoUl">
  {#if allIncompleteTasks.length > 0}
    <li class="subTasksInfo">
      {allIncompleteTasks.length} incomplete
      {#if allIncompleteTasksAssignedToMe.length > 0}
        ({allIncompleteTasksAssignedToMe.length} assigned to <span class="assignedToMe">Me</span>)
      {/if}
    </li>
  {/if}
  {#if allCompletedTasks.length > 0}
    <li class="subTasksInfo">
      {allCompletedTasks.length} complete
    </li>
  {/if}
</ul>

<style>
  .subTasksInfoUl {
    margin-block-start: 0;
    margin-block-end: 0;
    padding-inline-start: 12px;
  }
  .assignedToMe {
    color: var(--mdc-theme-primary);
  }
</style>
