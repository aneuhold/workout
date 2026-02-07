<script lang="ts">
  import {
    type DashboardTask,
    type DashboardTaskListFilterSettings,
    DashboardTaskListFilterSettingsSchema,
    type DashboardTaskListSortSettings
  } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import ClickableDiv from '$components/presentational/ClickableDiv.svelte';
  import SquareIconButton from '$components/presentational/SquareIconButton.svelte';
  import taskMapService from '$services/Task/TaskMapService/TaskMapService';
  import TaskTagsService from '$services/Task/TaskTagsService';
  import { currentUserId } from '$stores/derived/currentUserId';
  import { userConfig } from '$stores/local/userConfig/userConfig';
  import TaskListFilterDialog from './TaskListFilterDialog.svelte';
  import TaskListSortingDialog from './TaskListSortingDialog.svelte';

  let {
    category,
    parentTask,
    parentTaskSortSettings,
    userTaskSortSettings,
    currentSortSettings,
    removedTaskIds
  }: {
    category: string;
    parentTask?: DashboardTask;
    parentTaskSortSettings?: DashboardTaskListSortSettings;
    userTaskSortSettings?: DashboardTaskListSortSettings;
    currentSortSettings: DashboardTaskListSortSettings;
    removedTaskIds: UUID[];
  } = $props();

  const globalTags = TaskTagsService.getStore();

  let sortingDialogOpen = $state(false);
  let filterDialogOpen = $state(false);

  function getTaskSpecificText(settingsInfo: {
    parentTask?: DashboardTask;
    parentTaskSortSettings?: DashboardTaskListSortSettings;
    parentTaskFilterSettings?: DashboardTaskListFilterSettings;
  }) {
    const { parentTask, parentTaskSortSettings, parentTaskFilterSettings } = settingsInfo;
    if (parentTask) {
      if (parentTaskSortSettings && parentTaskFilterSettings) {
        return 'Task-specific sort + filter';
      } else if (parentTaskSortSettings) {
        return 'Task-specific sort';
      } else if (parentTaskFilterSettings) {
        return 'Task-specific filter';
      }
    }
    return '';
  }

  function handleUpdateSortSettings(newSortSettings: DashboardTaskListSortSettings) {
    if (parentTask) {
      taskMapService.updateDoc(parentTask._id, (task: DashboardTask) => {
        task.sortSettings[$currentUserId] = newSortSettings;
        return task;
      });
    } else {
      $userConfig.config.taskListSortSettings[category] = newSortSettings;
    }
  }
  function handleResetSortSettings() {
    if (parentTask) {
      taskMapService.updateDoc(parentTask._id, (task: DashboardTask) => {
        delete task.sortSettings[$currentUserId];
        return task;
      });
    } else {
      const sortSettings = $userConfig.config.taskListSortSettings;
      delete sortSettings[category];
      $userConfig.config.taskListSortSettings = sortSettings;
    }
  }
  function handleUpdateFilterSettings(newFilterSettings: DashboardTaskListFilterSettings) {
    if (parentTask) {
      taskMapService.updateDoc(parentTask._id, (task: DashboardTask) => {
        task.filterSettings[$currentUserId] = newFilterSettings;
        return task;
      });
    } else {
      $userConfig.config.taskListFilterSettings[category] = newFilterSettings;
    }
  }
  function handleResetFilterSettings() {
    if (parentTask) {
      taskMapService.updateDoc(parentTask._id, (task: DashboardTask) => {
        delete task.filterSettings[$currentUserId];
        return task;
      });
    } else {
      const filterSettings = $userConfig.config.taskListFilterSettings;
      delete filterSettings[category];
      $userConfig.config.taskListFilterSettings = filterSettings;
    }
  }
  let parentTaskFilterSettings = $derived(
    parentTask ? parentTask.filterSettings[$currentUserId] : undefined
  );
  let userTaskFilterSettings = $derived($userConfig.config.taskListFilterSettings[category]);
  let currentFilterSettings = $derived(
    parentTaskFilterSettings ??
      userTaskFilterSettings ??
      DashboardTaskListFilterSettingsSchema.parse({ userId: $currentUserId })
  );
  let sortingDimmed = $derived(parentTask ? !parentTaskSortSettings : !userTaskSortSettings);
  let filterDimmed = $derived(parentTask ? !parentTaskFilterSettings : !userTaskFilterSettings);
  let taskSpecificText = $derived(
    getTaskSpecificText({
      parentTask: parentTask,
      parentTaskSortSettings,
      parentTaskFilterSettings
    })
  );
  let tagsWithRemovedIds = $derived(
    removedTaskIds.reduce((tagSet, id) => {
      const task = taskMapService.mapState[id];
      const currentUserTags = task?.tags[$currentUserId];
      if (task && currentUserTags) {
        currentUserTags.forEach((tag: string) => tagSet.add(tag));
      }
      return tagSet;
    }, new Set<string>())
  );
  /**
   * Tags that are hidden, but only those that actually have tasks with removed
   * ids.
   */
  let hiddenTags = $derived(
    $globalTags.filter(
      (tag) =>
        currentFilterSettings.tags[tag] &&
        !currentFilterSettings.tags[tag].show &&
        tagsWithRemovedIds.has(tag)
    )
  );
</script>

<div class="container">
  <ClickableDiv
    clickAction={() => {
      sortingDialogOpen = true;
    }}
  >
    <SquareIconButton iconName="sort" variant="outlined" disabled={sortingDimmed} />
  </ClickableDiv>
  {#if parentTask || hiddenTags.length > 0}
    <div class="centerText dimmed-color">
      {#if parentTask}
        <i>{taskSpecificText}</i>
      {/if}
      {#if hiddenTags.length > 0}
        <i class="mdc-typography--body2">{hiddenTags.join(', ')} Hidden</i>
      {/if}
    </div>
  {/if}

  <ClickableDiv
    clickAction={() => {
      filterDialogOpen = true;
    }}
  >
    <SquareIconButton iconName="filter_list" variant="outlined" disabled={filterDimmed} />
  </ClickableDiv>
</div>

<TaskListSortingDialog
  initialSettings={currentSortSettings}
  bind:open={sortingDialogOpen}
  onUpdateSettings={handleUpdateSortSettings}
  onReset={handleResetSortSettings}
/>
<TaskListFilterDialog
  initialSettings={currentFilterSettings}
  bind:open={filterDialogOpen}
  onUpdateSettings={handleUpdateFilterSettings}
  onReset={handleResetFilterSettings}
/>

<style>
  .container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 8px;
    align-items: center;
  }
  .centerText {
    display: flex;
    flex-direction: column;
    text-wrap: wrap;
    text-align: center;
  }
</style>
