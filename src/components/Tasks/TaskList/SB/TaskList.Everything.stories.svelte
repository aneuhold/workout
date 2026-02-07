<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import sbTaskListMetaBase from '$components/Tasks/TaskList/SB/TaskList.stories.base';
  import {
    MockTaskAssignment,
    MockTaskDescription,
    MockTaskSharedWith,
    MockTaskSubTasks
  } from '$services/Task/TaskMapService/TaskMapService.mock';

  const { Story } = defineMeta({
    ...sbTaskListMetaBase,
    title: 'Stateful Components/TaskList/Everything'
  });
</script>

<Story
  name="All Options"
  args={{
    numTasks: 25,
    includeDueDates: true,
    includeOverDueDates: true,
    includeStartDates: true,
    includeStartDatesInFuture: true,
    sharedWith: MockTaskSharedWith.withMultiplePeople,
    assignedTo: MockTaskAssignment.toMe,
    tags: ['tag1', 'tag2', 'tag3', 'Some Really Long Tag Name', 'Tag5', 'Tag6'],
    descriptions: MockTaskDescription.long,
    subtasks: MockTaskSubTasks.allVariations
  }}
/>
