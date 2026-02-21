<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import MockData from '$testUtils/MockData';
  import MesocyclePage from '../MesocyclePage.svelte';

  const { Story } = defineMeta({
    title: 'Pages/NewMesocyclePage',
    tags: ['!autodocs'],
    component: MesocyclePage,
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
