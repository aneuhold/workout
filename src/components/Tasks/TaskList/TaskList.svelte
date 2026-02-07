<!--
  @component
  
  A list of tasks.
-->
<script lang="ts">
  import type { DashboardTaskFilterAndSortResult } from '@aneuhold/core-ts-db-lib';
  import {
    DashboardTaskListSortSettingsSchema,
    DashboardTaskService,
    DashboardTaskSortBy
  } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import { flip } from 'svelte/animate';
  import { slide } from 'svelte/transition';
  import TaskRow from '$components/Tasks/TaskList/TaskRow.svelte';
  import taskMapService from '$services/Task/TaskMapService/TaskMapService';
  import { currentUserId } from '$stores/derived/currentUserId';
  import { userConfig } from '$stores/local/userConfig/userConfig';
  import TaskListOptions from './TaskListOptions.svelte';

  let {
    sortAndFilterResult,
    category,
    parentTaskId
  }: {
    sortAndFilterResult: DashboardTaskFilterAndSortResult;
    category: string;
    parentTaskId?: UUID;
  } = $props();

  let parentTask = $derived(parentTaskId ? taskMapService.mapState[parentTaskId] : undefined);
  let parentTaskSortSettings = $derived(
    parentTask ? parentTask.sortSettings[$currentUserId] : undefined
  );
  let userTaskSortSettings = $derived($userConfig.config.taskListSortSettings[category]);
  let currentSortSettings = $derived(
    parentTaskSortSettings ??
      userTaskSortSettings ??
      DashboardTaskListSortSettingsSchema.parse({ userId: $currentUserId })
  );
  let isSortedByTagsFirst = $derived(
    currentSortSettings.sortList.length !== 0 &&
      currentSortSettings.sortList[0].sortBy === DashboardTaskSortBy.tags
  );
  let tagHeaderMap = $derived(
    isSortedByTagsFirst
      ? DashboardTaskService.getTagHeaderMap(
          taskMapService.mapState,
          sortAndFilterResult.filteredAndSortedIds,
          $currentUserId,
          $userConfig.config.tagSettings,
          'No Priority',
          currentSortSettings.sortList[0].sortDirection
        )
      : undefined
  );
</script>

<div class="content">
  <TaskListOptions
    {category}
    {parentTask}
    {currentSortSettings}
    {userTaskSortSettings}
    {parentTaskSortSettings}
    removedTaskIds={sortAndFilterResult.removedIds}
  />
  {#each sortAndFilterResult.filteredAndSortedIds as taskId (taskId)}
    <div transition:slide animate:flip={{ duration: 200 }}>
      {#if taskMapService.mapState[taskId]}
        <TaskRow
          tagHeaderName={tagHeaderMap && tagHeaderMap[taskId] ? tagHeaderMap[taskId] : undefined}
          task={taskMapService.mapState[taskId]}
        />
      {/if}
    </div>
  {/each}
  {#if sortAndFilterResult.removedIds.length > 0}
    <div class="removedTasksText">
      <i class=" dimmed-color">
        {sortAndFilterResult.removedIds.length} Task{sortAndFilterResult.removedIds.length > 1
          ? 's'
          : ''} Hidden due to Filters
      </i>
    </div>
  {/if}
</div>

<style>
  .content {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  .removedTasksText {
    display: flex;
    justify-content: center;
    margin-top: 8px;
  }
</style>
