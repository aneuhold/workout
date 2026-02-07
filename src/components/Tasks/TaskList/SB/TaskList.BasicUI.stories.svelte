<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import sbTaskListMetaBase from '$components/Tasks/TaskList/SB/TaskList.stories.base';

  const { Story } = defineMeta({
    ...sbTaskListMetaBase,
    title: 'Stateful Components/TaskList/Basic UI'
  });
</script>

<Story name="Single Task" args={{ numTasks: 1 }} />
<Story name="No Tasks" args={{ numTasks: 0 }} />
<Story name="Multiple Tasks" />
