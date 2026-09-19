<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { spyOn } from 'storybook/test';
  import demoModeService from '$services/DemoMode.service.svelte';
  import DemoModeButton from './DemoModeButton.svelte';

  const { Story } = defineMeta({
    title: 'Components/DemoModeButton',
    component: DemoModeButton,
    beforeEach: () => {
      // Stub exit so clicking doesn't clear session storage or navigate away from Storybook
      const exitSpy = spyOn(demoModeService, 'exit').mockReturnValue(undefined);
      return () => {
        exitSpy.mockRestore();
      };
    }
  });
</script>

<Story name="Default" globals={{ viewport: null }} />

<Story name="Mobile" globals={{ viewport: { value: 'mobile' } }} />
