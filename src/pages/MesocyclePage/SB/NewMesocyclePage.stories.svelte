<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import MockData from '$testUtils/MockData';
  import NewMesocyclePage from '../NewMesocyclePage.svelte';

  const { Story } = defineMeta({
    title: 'Pages/NewMesocyclePage',
    tags: ['!autodocs'],
    component: NewMesocyclePage,
    parameters: {
      layout: 'fullscreen'
    },
    beforeEach: () => {
      MockData.resetAll();
      MockData.setupBaseData();
    }
  });
</script>

<Story name="Empty Form" />
