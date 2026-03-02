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
      ...createBoolArgTypes('isNew', 'notFound', 'noCalibration', 'noFatigueGuess')
    },
    args: {
      isNew: false,
      notFound: false,
      noCalibration: false,
      noFatigueGuess: false
    }
  });
</script>

<Story name="Existing Exercise" />

<Story name="New Exercise" args={{ isNew: true }} />

<Story name="Exercise Not Found" args={{ notFound: true }} />

<Story name="No Calibration" args={{ noCalibration: true }} />

<Story name="No Fatigue Guess" args={{ noFatigueGuess: true }} />
