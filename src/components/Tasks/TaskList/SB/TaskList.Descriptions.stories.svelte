<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import sbTaskListMetaBase from '$components/Tasks/TaskList/SB/TaskList.stories.base';
  import { MockTaskDescription } from '$services/Task/TaskMapService/TaskMapService.mock';

  const { Story } = defineMeta({
    ...sbTaskListMetaBase,
    title: 'Stateful Components/TaskList/Descriptions'
  });
</script>

<Story name="Short Description" args={{ numTasks: 20, descriptions: MockTaskDescription.short }} />
<Story name="Long Description" args={{ numTasks: 20, descriptions: MockTaskDescription.long }} />
