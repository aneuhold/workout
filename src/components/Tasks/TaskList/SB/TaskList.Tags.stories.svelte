<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import sbTaskListMetaBase from '$components/Tasks/TaskList/SB/TaskList.stories.base';

  const { Story } = defineMeta({
    ...sbTaskListMetaBase,
    title: 'Stateful Components/TaskList/Tags'
  });
</script>

<Story name="Single Tag" args={{ numTasks: 1, tags: ['tag1'] }} />

<Story name="Three Tags" args={{ numTasks: 1, tags: ['tag1', 'tag2', 'tag3'] }} />

<Story
  name="Many Tags"
  args={{
    numTasks: 1,
    tags: ['tag1', 'tag2', 'tag3', 'Some Really Long Tag Name', 'Tag5', 'Tag6']
  }}
/>
