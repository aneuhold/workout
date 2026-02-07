<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { fn } from 'storybook/test';
  import { createInvisibleArgTypes, createTextArgTypes } from '$storybook/storybookUtil';
  import FabButton from './FabButton.svelte';

  const { Story } = defineMeta({
    title: 'Presentational Components/FabButton',
    component: FabButton,
    argTypes: {
      ...createInvisibleArgTypes('clickHandler'),
      ...createTextArgTypes('label', 'iconName')
    }
  });
</script>

<!-- Without Label Story -->
<Story name="Without Label" args={{ iconName: 'add', clickHandler: fn() }} />

<!-- With Label Story -->
<Story name="With Label" args={{ iconName: 'add', label: 'Add', clickHandler: fn() }} />

<!-- Different Icons Story -->
<Story name="Different Icons" args={{ iconName: 'edit', label: 'Edit', clickHandler: fn() }} />
