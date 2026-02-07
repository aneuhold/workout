<!--
  @component
  
  A page for main tasks for the current user.
-->
<script lang="ts">
  import { DashboardTaskSchema } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import PageTitle from '$components/PageTitle.svelte';
  import FabButton from '$components/presentational/FabButton/FabButton.svelte';
  import TaskDetails from '$components/Tasks/TaskDetails/TaskDetails.svelte';
  import TaskList from '$components/Tasks/TaskList/TaskList.svelte';
  import TaskListService from '$services/Task/TaskListService';
  import taskMapService from '$services/Task/TaskMapService/TaskMapService';
  import TaskUtilityService from '$services/Task/TaskUtilityService';
  import { userConfig } from '$stores/local/userConfig/userConfig';
  import { tasksPageInfo } from './pageInfo';

  let sortAndFilterResult = $derived(
    TaskListService.getTaskIds(taskMapService.mapState, $userConfig, 'default')
  );
  let taskId = $derived($page.url.searchParams.get('taskId') as UUID | undefined);

  function addTask() {
    const newTask = DashboardTaskSchema.parse({ userId: $userConfig.config.userId });
    taskMapService.addDoc(newTask);
    goto(TaskUtilityService.getTaskRoute(newTask._id));
  }
</script>

<svelte:head>
  <title
    >{taskId && taskMapService.mapState[taskId]
      ? taskMapService.mapState[taskId].title
      : tasksPageInfo.shortTitle}</title
  >
  <meta name="description" content={tasksPageInfo.description} />
</svelte:head>

<div class="content">
  {#if taskId}
    <TaskDetails {taskId} />
  {:else}
    <PageTitle title={tasksPageInfo.shortTitle} subtitle={tasksPageInfo.description} />

    <TaskList category="default" {sortAndFilterResult} />

    <FabButton clickHandler={addTask} iconName="add" />
  {/if}
</div>

<style>
  .content {
    /* Some extra margin to allow scrolling */
    margin-bottom: 80px;
  }
</style>
