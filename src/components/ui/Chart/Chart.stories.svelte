<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createInvisibleArgTypes } from '$storybook/storybookUtil';
  import SBChartExample from './SBChartExample.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Chart',
    component: SBChartExample,
    argTypes: {
      ...createInvisibleArgTypes('ref', 'children'),
      seriesLayout: {
        control: { type: 'select' },
        options: ['group', 'stack']
      },
      showLegend: {
        control: { type: 'boolean' }
      },
      showTooltip: {
        control: { type: 'boolean' }
      }
    },
    args: {
      seriesLayout: 'group',
      showLegend: false,
      showTooltip: true
    }
  });
</script>

<!-- Default Bar Chart -->
<Story name="Default" />

<!-- Stacked Bar Chart -->
<Story name="Stacked" args={{ seriesLayout: 'stack' }} />

<!-- With Legend -->
<Story name="With Legend" args={{ showLegend: true }} />

<!-- Without Tooltip -->
<Story name="Without Tooltip" args={{ showTooltip: false }} />
