<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import sbTaskListMetaBase from '$components/Tasks/TaskList/SB/TaskList.stories.base';
  import { MockTaskSharedWith } from '$services/Task/TaskMapService/TaskMapService.mock';

  const { Story } = defineMeta({
    ...sbTaskListMetaBase,
    title: 'Stateful Components/TaskList/Shared With'
  });
</script>

<Story name="With Me" args={{ numTasks: 1, sharedWith: MockTaskSharedWith.withMe }} />
<Story
  name="With 1 Person"
  args={{ numTasks: 1, sharedWith: MockTaskSharedWith.withSinglePerson }}
/>
<Story
  name="With 2 People"
  args={{ numTasks: 1, sharedWith: MockTaskSharedWith.withMultiplePeople }}
/>
