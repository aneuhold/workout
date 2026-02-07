<script lang="ts">
  import { untrack } from 'svelte';
  import TaskListService from '$services/Task/TaskListService';
  import taskMapService from '$services/Task/TaskMapService/TaskMapService';
  import {
    MockTaskAssignment,
    MockTaskDescription,
    MockTaskSharedWith,
    MockTaskSubTasks
  } from '$services/Task/TaskMapService/TaskMapService.mock';
  import { userConfig } from '$stores/local/userConfig/userConfig';
  import MockData from '$testUtils/MockData';
  import TaskList from '../TaskList.svelte';

  let {
    numTasks = 20,
    includeStartDates = false,
    includeStartDatesInFuture = false,
    includeDueDates = false,
    includeOverDueDates = false,
    sharedWith = MockTaskSharedWith.none,
    assignedTo = MockTaskAssignment.none,
    tags = [],
    descriptions = MockTaskDescription.none,
    subtasks = MockTaskSubTasks.none
  }: {
    numTasks?: number;
    includeStartDates?: boolean;
    includeStartDatesInFuture?: boolean;
    includeDueDates?: boolean;
    includeOverDueDates?: boolean;
    sharedWith?: MockTaskSharedWith;
    assignedTo?: MockTaskAssignment;
    tags?: string[];
    descriptions?: MockTaskDescription;
    subtasks?: MockTaskSubTasks;
  } = $props();

  $effect(() => {
    // Track all props
    const options = {
      numTasks,
      includeStartDates,
      includeStartDatesInFuture,
      includeDueDates,
      includeOverDueDates,
      sharedWith,
      assignedTo,
      tags,
      descriptions,
      subtasks
    };

    untrack(() => {
      MockData.taskMapServiceMock.reset();
      MockData.taskMapServiceMock.addTasks(options);
    });

    return () => {
      untrack(() => {
        MockData.taskMapServiceMock.reset();
      });
    };
  });

  let sortAndFilterResult = $derived(
    TaskListService.getTaskIds(taskMapService.mapState, $userConfig, 'default')
  );
</script>

<TaskList category="default" {sortAndFilterResult} />
