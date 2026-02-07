<script lang="ts">
  import { type DashboardTask } from '@aneuhold/core-ts-db-lib';
  import type { UUID } from 'crypto';
  import { untrack } from 'svelte';
  import {
    MockTaskAssignment,
    MockTaskSharedWith
  } from '$services/Task/TaskMapService/TaskMapService.mock';
  import MockData from '$testUtils/MockData';
  import TaskDetails from '../TaskDetails.svelte';

  let {
    mainTaskExists = true,
    sharedWith = MockTaskSharedWith.none,
    assignedTo = MockTaskAssignment.none
  }: {
    mainTaskExists?: boolean;
    sharedWith?: MockTaskSharedWith;
    assignedTo?: MockTaskAssignment;
  } = $props();

  let mainTask: DashboardTask | undefined = $state();
  let taskId = $derived(mainTask ? mainTask._id : ('non-existent-id' as UUID));

  $effect(() => {
    // Track props to re-run the effect when they change
    const exists = mainTaskExists;
    const sw = sharedWith;
    const at = assignedTo;

    untrack(() => {
      MockData.taskMapServiceMock.reset();
      if (exists) {
        mainTask = MockData.taskMapServiceMock.addTask({
          title: 'TestTask',
          sharedWith: sw,
          assignedTo: at
        });
      } else {
        mainTask = undefined;
      }
    });

    return () => {
      untrack(() => {
        MockData.taskMapServiceMock.reset();
      });
    };
  });
</script>

<TaskDetails {taskId} />
