<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createNumberArgTypes } from '$storybook/storybookUtil';
  import SbConfettiExample from './SBConfettiExample.svelte';

  const { Story } = defineMeta({
    title: 'Singletons/Confetti',
    component: SbConfettiExample,
    argTypes: {
      ...createNumberArgTypes('numButtons')
    }
  });
</script>

<Story name="Default" args={{ numButtons: 1 }} />
<Story name="Multiple Confetti" args={{ numButtons: 55 }} />
