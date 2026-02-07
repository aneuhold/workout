<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import sbTaskListMetaBase from '$components/Tasks/TaskList/SB/TaskList.stories.base';
  import {
    MockTaskSharedWith,
    MockTaskSubTasks
  } from '$services/Task/TaskMapService/TaskMapService.mock';

  const { Story } = defineMeta({
    ...sbTaskListMetaBase,
    title: 'Stateful Components/TaskList/Sub Tasks'
  });
</script>

<Story name="Some Completed" args={{ numTasks: 3, subtasks: MockTaskSubTasks.someCompleted }} />
<Story name="Some Incomplete" args={{ numTasks: 3, subtasks: MockTaskSubTasks.someIncomplete }} />
<Story
  name="Some Complete And Incomplete"
  args={{
    numTasks: 3,
    sharedWith: MockTaskSharedWith.withMe,
    subtasks: MockTaskSubTasks.someCompleteAndIncomplete
  }}
/>
<Story
  name="Some Assigned To Me And Complete"
  args={{
    numTasks: 3,
    sharedWith: MockTaskSharedWith.withMe,
    subtasks: MockTaskSubTasks.someAssignedToMeAndComplete
  }}
/>
<Story
  name="Some Assigned To Me And Incomplete"
  args={{
    numTasks: 3,
    sharedWith: MockTaskSharedWith.withMe,
    subtasks: MockTaskSubTasks.someAssignedToMeAndIncomplete
  }}
/>
<Story
  name="All Variations"
  args={{
    numTasks: 3,
    sharedWith: MockTaskSharedWith.withMe,
    subtasks: MockTaskSubTasks.allVariations
  }}
/>
