<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { userConfig } from '$stores/local/userConfig/userConfig';
  import { createNumberArgTypes } from '$storybook/storybookUtil';
  import SbConfettiExample from './SBConfettiExample.svelte';

  const { Story } = defineMeta({
    title: 'Singleton Components/Confetti',
    component: SbConfettiExample,
    argTypes: {
      ...createNumberArgTypes('numButtons')
    },
    beforeEach: () => {
      userConfig.update((settings) => {
        settings.config.enabledFeatures.useConfettiForTasks = true;
        return settings;
      });
    }
  });
</script>

<Story name="Default" args={{ numButtons: 1 }} />
<Story name="Multiple Confetti" args={{ numButtons: 55 }} />
