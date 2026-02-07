<!--
  @component
  
  A single task that can be displayed in a row format.
-->
<script lang="ts">
  import {
    type DashboardTask,
    DashboardTaskService,
    RecurrenceEffect
  } from '@aneuhold/core-ts-db-lib';
  import Card, { Content as CardContent } from '@smui/card';
  import { Icon } from '@smui/icon-button';
  import { goto } from '$app/navigation';
  import ClickableDiv from '$components/presentational/ClickableDiv.svelte';
  import MenuButton, { type MenuButtonItem } from '$components/presentational/MenuButton.svelte';
  import { confirmationDialog } from '$components/singletons/dialogs/SingletonConfirmationDialog/SingletonConfirmationDialog.svelte';
  import { taskAssignmentDialog } from '$components/singletons/dialogs/SingletonTaskAssignmentDialog/SingletonTaskAssignmentDialog.svelte';
  import { taskSharingDialog } from '$components/singletons/dialogs/SingletonTaskSharingDialog/SingletonTaskSharingDialog.svelte';
  import taskMapService from '$services/Task/TaskMapService/TaskMapService';
  import TaskUtilityService from '$services/Task/TaskUtilityService';
  import { currentUserId } from '$stores/derived/currentUserId';
  import { userConfig } from '$stores/local/userConfig/userConfig';
  import TaskCompletedCheckbox from '../TaskCompletedCheckbox.svelte';
  import TaskRowDateInfo from '../TaskDate/TaskRowDateInfo.svelte';
  import TaskRowTagHeader from '../TaskTags/TaskRowTagHeader.svelte';
  import TaskRowSubtaskInfo from './TaskRowSubtaskInfo.svelte';

  let {
    task,
    /**
     * If set, it will display the tag as a header above the task.
     */
    tagHeaderName
  }: {
    task: DashboardTask;
    /**
     * If set, it will display the tag as a header above the task.
     */
    tagHeaderName?: string;
  } = $props();

  /**
   * Used so that the animation doesn't play every time the task shows up,
   * only when completed is clicked.
   */
  let completeAnimationShouldShow = $state(false);
  // svelte-ignore state_referenced_locally
  let previousTaskCompletedState = $state(task.completed);

  function goToTask() {
    goto(TaskUtilityService.getTaskRoute(task._id));
  }

  function handleDuplicateClick() {
    taskMapService.duplicateTask(task._id);
  }

  function handleSkipClick() {
    const currentTask = task;
    confirmationDialog.open({
      title: 'Skip to next Task Recurrence',
      message:
        `Are you sure you want to skip ${
          currentTask.title === '' ? 'this task' : `"${currentTask.title}"`
        }? This will move the task forward as if it has recurred. ` +
        `This is nice if you want to skip a task instead of completing it ` +
        `because it wasn't actually done. Save that dopamine! ❤️`,
      onConfirm: () => {
        taskMapService.executeRecurrenceForTask(currentTask);
      }
    });
  }

  function getMenuItems(task: DashboardTask) {
    const menuItems: MenuButtonItem[] = [
      {
        title: 'Edit',
        iconName: 'edit',
        clickAction: goToTask
      }
    ];
    if (
      task.recurrenceInfo &&
      !task.completed &&
      task.recurrenceInfo.recurrenceEffect !== RecurrenceEffect.stack &&
      !task.parentRecurringTaskInfo
    ) {
      menuItems.push({
        title: 'Skip',
        iconName: 'skip_next',
        clickAction: handleSkipClick
      });
    }
    if (task.userId === $currentUserId && finalSharedParentId === task._id) {
      menuItems.push({
        title: 'Share',
        iconName: 'share',
        clickAction: () => {
          taskSharingDialog.open(task._id);
        }
      });
    }
    if (task.sharedWith.length > 0) {
      menuItems.push({
        title: 'Assign',
        iconName: 'assignment_ind',
        clickAction: () => {
          taskAssignmentDialog.open(task._id);
        }
      });
    }
    menuItems.push({
      title: 'Duplicate',
      iconName: 'content_copy',
      clickAction: handleDuplicateClick
    });
    menuItems.push({
      title: 'Delete',
      iconName: 'delete',
      clickAction: () => {
        TaskUtilityService.handleDeleteTaskClick(
          allChildrenIds.length,
          () => {
            taskMapService.deleteDoc(task._id);
          },
          task.title
        );
      }
    });
    return menuItems;
  }

  let allChildrenIds = $derived(
    DashboardTaskService.getChildrenIds(
      Object.values(taskMapService.mapState).filter(
        (task): task is DashboardTask => task !== undefined
      ),
      [task._id]
    )
  );
  let hasExtraTaskInfo = $derived(allChildrenIds.length > 0 || task.assignedTo);
  let finalSharedParentId = $derived(TaskUtilityService.findParentIdWithSameSharedWith(task));
  let usersTaskTags = $derived(task.tags[$currentUserId]);
  let menuItems = $derived(getMenuItems(task));
  $effect(() => {
    if (task.completed !== previousTaskCompletedState) {
      completeAnimationShouldShow = true;
      previousTaskCompletedState = task.completed;
    }
  });
  let currentStrikeClass = $derived(
    completeAnimationShouldShow && task.completed
      ? ' strikeAnimate'
      : task.completed
        ? ' strike'
        : ''
  );
  let currentDimClass = $derived(
    completeAnimationShouldShow && task.completed ? ' dimAnimate' : task.completed ? ' dim' : ''
  );
  let trimmedTaskDescription = $derived(
    task.description
      ? task.description.length > 100
        ? `${task.description.substring(0, 100)}...`
        : task.description
      : ''
  );
  let assignedToMe = $derived(task.assignedTo ? task.assignedTo === $currentUserId : false);
  let assignedToName = $derived(
    task.assignedTo
      ? assignedToMe
        ? 'Me'
        : $userConfig.collaborators[task.assignedTo].userName
      : ''
  );
</script>

{#if tagHeaderName}
  <TaskRowTagHeader tagName={tagHeaderName} />
{/if}
<div class="container">
  <Card>
    <CardContent class="taskRowCard">
      <div class="card-content">
        <TaskCompletedCheckbox {task} />
        <ClickableDiv clickAction={goToTask}>
          <div class={`taskInfoContent` + currentDimClass}>
            <h4 class={`mdc-typography--body1 no-before title${currentStrikeClass}`}>
              {#if task.title !== ''}
                <span>{task.title}</span>
              {:else}
                <i class="dimmed-color">Untitled</i>
              {/if}
              {#if task.sharedWith.length > 0}
                <Icon class="material-icons dimmed-color small-icon">group</Icon>
              {/if}
              {#if task.recurrenceInfo}
                <Icon class="material-icons dimmed-color small-icon">autorenew</Icon>
              {/if}
              {#if usersTaskTags && usersTaskTags.length > 0}
                <div class="tagsContainer">
                  <Icon class="material-icons dimmed-color small-icon">sell</Icon>
                  {#each usersTaskTags as tag, index (tag)}
                    <i class="mdc-typography--caption mdc-theme--text-hint-on-background no-before">
                      {`${tag}${index === usersTaskTags.length - 1 ? '' : ', '}`}
                    </i>
                  {/each}
                </div>
              {/if}
            </h4>
            <TaskRowDateInfo {task} />
            {#if task.description && task.description !== ''}
              <span class="description mdc-deprecated-list-item__secondary-text no-before">
                {trimmedTaskDescription}
              </span>
            {/if}
            {#if hasExtraTaskInfo}
              <div
                class="mdc-typography--caption mdc-theme--text-hint-on-background no-before extraTaskInfo"
              >
                {#if task.assignedTo}
                  <span>
                    Assigned To:
                    <span class={assignedToMe ? `assignedToMe` : ''}>{assignedToName}</span>
                  </span>
                {/if}
                {#if allChildrenIds.length > 0}
                  <TaskRowSubtaskInfo {allChildrenIds} />
                {/if}
              </div>
            {/if}
          </div>
        </ClickableDiv>
        <MenuButton {menuItems} alignCenterVertically />
      </div>
    </CardContent>
  </Card>
</div>

<style>
  * :global(.taskRowCard) {
    padding: 0px;
  }
  .container {
    padding: 2px;
  }
  .taskInfoContent {
    display: flex;
    flex-direction: column;
    padding: 16px 0px;
    container-type: inline-size;
  }
  .description {
    margin-top: 4px;
    margin-bottom: 0px;
  }
  /* Container queries yay! */
  @container (min-width: 1px) {
    .description {
      max-width: 100cqw;
    }
  }
  .extraTaskInfo {
    margin-top: 2px;
    margin-bottom: 0px;
    display: flex;
    flex-direction: column;
  }
  .title {
    margin-top: 0px;
    margin-bottom: 0px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }
  .tagsContainer {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }
  .card-content {
    display: grid;
    grid-template-columns: min-content 1fr min-content;
  }
  .assignedToMe {
    color: var(--mdc-theme-primary);
  }
  .dim {
    opacity: 0.3;
  }
  .dimAnimate {
    animation-name: dim;
    animation-duration: 1s;
    animation-timing-function: cubic-bezier(0.5, 1, 0.5, 1);
    animation-iteration-count: 1;
    animation-fill-mode: forwards;
  }
  .strike {
    position: relative;
    &::after {
      content: ' ';
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 1px;
      opacity: 0.3;
      background: var(--mdc-theme-text-primary-on-background);
    }
  }
  .strikeAnimate {
    position: relative;
  }
  .strikeAnimate::after {
    content: ' ';
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 1px;
    background: var(--mdc-theme-text-primary-on-background);
    animation-name: strike;
    animation-duration: 1s;
    animation-timing-function: cubic-bezier(0.5, 1, 0.5, 1);
    animation-iteration-count: 1;
    animation-fill-mode: forwards;
  }
  @keyframes dim {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0.3;
    }
  }
  @keyframes strike {
    0% {
      width: 0;
    }
    100% {
      width: 100%;
    }
  }
</style>
