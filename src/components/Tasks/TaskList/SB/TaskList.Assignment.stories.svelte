<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import sbTaskListMetaBase from '$components/Tasks/TaskList/SB/TaskList.stories.base';
  import {
    MockTaskAssignment,
    MockTaskSharedWith
  } from '$services/Task/TaskMapService/TaskMapService.mock';

  const { Story } = defineMeta({
    ...sbTaskListMetaBase,
    title: 'Stateful Components/TaskList/Assignment'
  });
</script>

<Story
  name="To Me"
  args={{ numTasks: 1, sharedWith: MockTaskSharedWith.withMe, assignedTo: MockTaskAssignment.toMe }}
/>
<Story
  name="To Other"
  args={{
    numTasks: 1,
    sharedWith: MockTaskSharedWith.withSinglePerson,
    assignedTo: MockTaskAssignment.toOther
  }}
/>
