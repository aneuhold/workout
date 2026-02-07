<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import sbTaskListMetaBase from '$components/Tasks/TaskList/SB/TaskList.stories.base';

  const { Story } = defineMeta({
    ...sbTaskListMetaBase,
    title: 'Stateful Components/TaskList/Dates'
  });
</script>

<Story name="Due Dates" args={{ includeDueDates: true }} />
<Story name="Start Dates" args={{ includeStartDates: true }} />
<Story name="Both Dates" args={{ includeDueDates: true, includeStartDates: true }} />
