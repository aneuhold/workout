<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SBWorkoutSessionCalendarExample from './SBWorkoutSessionCalendarExample.svelte';

  const { Story } = defineMeta({
    title: 'Components/WorkoutSessionCalendar',
    component: SBWorkoutSessionCalendarExample,
    argTypes: {
      empty: { control: 'boolean' }
    },
    args: {
      empty: false
    }
  });
</script>

<Story name="Default Preview" />

<Story name="Empty" args={{ empty: true }} />
