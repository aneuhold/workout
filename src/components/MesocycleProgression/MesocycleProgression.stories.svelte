<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SBMesocycleProgressionExample from './SBMesocycleProgressionExample.svelte';

  const { Story } = defineMeta({
    title: 'Components/MesocycleProgression',
    tags: ['!autodocs'],
    component: SBMesocycleProgressionExample,
    parameters: {
      layout: 'fullscreen'
    },
    argTypes: {
      completedSessionCount: {
        control: { type: 'number', min: 0, max: 30, step: 1 }
      }
    },
    args: {
      completedSessionCount: 0
    }
  });
</script>

<Story name="All Planned" args={{ completedSessionCount: 0 }} />

<Story name="Partially Completed" args={{ completedSessionCount: 8 }} />

<Story name="Fully Completed" args={{ completedSessionCount: 20 }} />
