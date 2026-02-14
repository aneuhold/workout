<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createBoolArgTypes } from '$storybook/storybookUtil';
  import SBExercisePageExample from './SBExercisePageExample.svelte';

  const { Story } = defineMeta({
    title: 'Pages/ExercisePage',
    tags: ['!autodocs'],
    component: SBExercisePageExample,
    parameters: {
      layout: 'fullscreen'
    },
    argTypes: {
      ...createBoolArgTypes('isNew', 'notFound')
    },
    args: {
      isNew: false,
      notFound: false
    }
  });
</script>

<Story name="Existing Exercise" />

<Story name="New Exercise" args={{ isNew: true }} />

<Story name="Exercise Not Found" args={{ notFound: true }} />
