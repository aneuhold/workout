<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    MockTaskAssignment,
    MockTaskSharedWith
  } from '$services/Task/TaskMapService/TaskMapService.mock';
  import sbTaskDetailsMeta from './TaskDetails.stories.base';

  const { Story } = defineMeta({
    ...sbTaskDetailsMeta,
    title: 'Stateful Components/TaskDetails/Assignment'
  });
</script>

<Story
  name="Assigned To Me And Other Owner"
  args={{ sharedWith: MockTaskSharedWith.withMe, assignedTo: MockTaskAssignment.toMe }}
/>
<Story
  name="Assigned To Me And Am Owner"
  args={{ sharedWith: MockTaskSharedWith.withSinglePerson, assignedTo: MockTaskAssignment.toMe }}
/>
<Story
  name="Assigned To Other And Other Owner"
  args={{ sharedWith: MockTaskSharedWith.withMe, assignedTo: MockTaskAssignment.toOther }}
/>
<Story
  name="Assigned To Other And Am Owner"
  args={{ sharedWith: MockTaskSharedWith.withSinglePerson, assignedTo: MockTaskAssignment.toOther }}
/>
