<!--
  @component
  
  A details component for a particular task for the user.

  ### Implementation notes:

  This will not be re-created for each task, but will instead be re-used, so
  the task needs to be dynamic.
-->
<script lang="ts">
  import {
    type DashboardTask,
    DashboardTaskSchema,
    DashboardTaskService
  } from '@aneuhold/core-ts-db-lib';
  import Button, { Icon } from '@smui/button';
  import Paper, { Content } from '@smui/paper';
  import type { UUID } from 'crypto';
  import { goto } from '$app/navigation';
  import BreadCrumb from '$components/BreadCrumb.svelte';
  import PageTitle from '$components/PageTitle.svelte';
  import FabButton from '$components/presentational/FabButton/FabButton.svelte';
  import InputBox from '$components/presentational/InputBox/InputBox.svelte';
  import TaskListService from '$services/Task/TaskListService';
  import taskMapService from '$services/Task/TaskMapService/TaskMapService';
  import TaskUtilityService from '$services/Task/TaskUtilityService';
  import { userConfig } from '$stores/local/userConfig/userConfig';
  import TaskCompletedCheckbox from '../TaskCompletedCheckbox.svelte';
  import TaskDateInfo from '../TaskDate/TaskDateInfo.svelte';
  import TaskList from '../TaskList/TaskList.svelte';
  import TaskRecurrenceInfo from '../TaskRecurrence/TaskRecurrenceInfo.svelte';
  import TaskTagsSelector from '../TaskTags/TaskTagsSelector.svelte';
  import TaskAssignmentButton from './TaskAssignmentButton.svelte';
  import TaskAssignmentInfo from './TaskAssignmentInfo.svelte';
  import TaskShareButton from './TaskShareButton.svelte';
  import TaskSharingInfo from './TaskSharingInfo.svelte';

  let {
    taskId
  }: {
    taskId: UUID;
  } = $props();

  let task = $derived(taskMapService.mapState[taskId]);
  let allChildrenIds = $derived(
    task
      ? DashboardTaskService.getChildrenIds(
          Object.values(taskMapService.mapState) as DashboardTask[],
          [task._id]
        )
      : []
  );
  let sortAndFilterResult = $derived(
    TaskListService.getTaskIdsForTask(taskMapService.mapState, $userConfig, allChildrenIds, task)
  );
  // Explicitly include `task` so that it reactively updates
  let breadCrumbArray = $derived(TaskUtilityService.getBreadCrumbArray(task ? task._id : taskId));
  let parentTaskId = $derived(task ? task.parentTaskId : undefined);
  let parentRoute = $derived(
    parentTaskId
      ? TaskUtilityService.getTaskRoute(parentTaskId)
      : TaskUtilityService.getTaskCategoryRoute(taskId)
  );

  function addSubTask() {
    if (!task) return;
    const newTask = DashboardTaskSchema.parse({
      userId: task.userId,
      title: 'New Task',
      parentTaskId: task._id,
      sharedWith: task.sharedWith,
      recurrenceInfo: task.recurrenceInfo,
      parentRecurringTaskInfo: task.recurrenceInfo
        ? {
            taskId: task._id,
            startDate: task.startDate,
            dueDate: task.dueDate
          }
        : undefined
    });
    taskMapService.addDoc(newTask);
    goto(TaskUtilityService.getTaskRoute(newTask._id));
  }

  function deleteTask() {
    if (!task) return;
    // Purposefully set the task ID, and don't use the one from the component
    // otherwise the parent will be deleted.
    const taskIdToDelete = task._id;
    goto(parentRoute).then(() => {
      taskMapService.deleteDoc(taskIdToDelete);
    });
  }
</script>

<div class="content">
  <BreadCrumb {breadCrumbArray} />
  {#if !task}
    <PageTitle includeBreadcrumb={false} title="Task not found 🥺" />
  {:else}
    <Paper>
      <Content>
        <div class="content paperContent">
          <div class="titleContainer">
            <TaskCompletedCheckbox {task} />
            <InputBox
              variant="outlined"
              label="Title"
              inputValue={task.title}
              onBlur={(val) => {
                taskMapService.updateDoc(taskId, (t) => {
                  t.title = val as string;
                  return t;
                });
              }}
            />
          </div>
          <InputBox
            label="Description"
            isTextArea={true}
            inputValue={task.description}
            onBlur={(val) => {
              taskMapService.updateDoc(taskId, (t) => {
                t.description = val as string;
                return t;
              });
            }}
          />
          <TaskDateInfo {task} />
          <TaskRecurrenceInfo {task} childTaskIds={allChildrenIds} />
          <div class="extraTaskInfo">
            <TaskTagsSelector {task} />
            <div>
              <TaskSharingInfo {task} />
              <TaskAssignmentInfo {task} />
            </div>
          </div>

          <div class="taskButtons">
            <TaskShareButton {task} />
            <Button
              variant="outlined"
              class="danger-button"
              onclick={() => {
                TaskUtilityService.handleDeleteTaskClick(
                  allChildrenIds.length,
                  deleteTask,
                  task?.title
                );
              }}
            >
              <Icon class="material-icons">delete</Icon>
              Delete
            </Button>
          </div>

          {#if task.sharedWith.length > 0}
            <div class="assignButton">
              <TaskAssignmentButton {task} />
            </div>
          {/if}

          <div class="doneButton">
            <Button
              onclick={() => goto(parentRoute)}
              style="width: 100%; max-width: 500px"
              variant="outlined"
              class="primary-button"
            >
              Done
            </Button>
          </div>
        </div>
      </Content>
    </Paper>
    {#if allChildrenIds.length !== 0}
      <div class="subTasksTitleContainer">
        <h3 class="mdc-typography--headline5 subTasksTitle">Sub Tasks</h3>
        {#if allChildrenIds.length > sortAndFilterResult.filteredAndSortedIds.length}
          <i class="mdc-typography--body1 subTasksTitle dimmed-color">
            {allChildrenIds.length} total child tasks
          </i>
        {/if}
      </div>
      <TaskList category={task.category} parentTaskId={taskId} {sortAndFilterResult} />
    {:else}
      <div class="mdc-typography--body1 subTasksTitle dimmed-color"><i>No sub tasks</i></div>
    {/if}
    <FabButton iconName="add" clickHandler={addSubTask} label="Add Subtask" />
  {/if}
</div>

<style>
  .titleContainer {
    display: grid;
    grid-template-columns: min-content 1fr;
  }
  .content {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 16px;
  }
  .extraTaskInfo {
    display: flex;
    flex-direction: row;
    gap: 16px;
    justify-content: space-between;
    flex-wrap: wrap;
  }
  .paperContent {
    gap: 16px;
  }
  .subTasksTitleContainer {
    display: flex;
    flex-direction: column;
  }
  .subTasksTitle {
    margin: auto;
    margin-top: 0px;
    margin-bottom: 0px;
  }
  .taskButtons {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: space-between;
  }
  .assignButton {
    display: flex;
    flex-direction: row;
  }
  .doneButton {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
