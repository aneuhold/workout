<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import sbTaskDetailsMeta from './TaskDetails.stories.base';

  const { Story } = defineMeta({
    ...sbTaskDetailsMeta,
    title: 'Stateful Components/TaskDetails/Basic UI'
  });
</script>

<Story name="Empty Task" args={{}} />
<Story name="No Task Found" args={{ mainTaskExists: false }} />
