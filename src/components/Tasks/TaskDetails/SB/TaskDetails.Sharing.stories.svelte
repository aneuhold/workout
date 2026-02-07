<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { MockTaskSharedWith } from '$services/Task/TaskMapService/TaskMapService.mock';
  import sbTaskDetailsMeta from './TaskDetails.stories.base';

  const { Story } = defineMeta({
    ...sbTaskDetailsMeta,
    title: 'Stateful Components/TaskDetails/Sharing'
  });
</script>

<Story name="Shared With Me" args={{ sharedWith: MockTaskSharedWith.withMe }} />
<Story name="Shared With 1 Person" args={{ sharedWith: MockTaskSharedWith.withSinglePerson }} />
<Story name="Shared With 2 People" args={{ sharedWith: MockTaskSharedWith.withMultiplePeople }} />
