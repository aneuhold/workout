<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createBoolArgTypes, createInvisibleArgTypes } from '$storybook/storybookUtil';
  import Switch from './Switch.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Switch',
    component: Switch,
    argTypes: {
      ...createInvisibleArgTypes('ref'),
      ...createBoolArgTypes('checked', 'disabled')
    },
    args: {
      checked: false,
      disabled: false
    }
  });
</script>

<!-- Default Switch -->
<Story name="Default" />

<!-- Checked Switch -->
<Story name="Checked" args={{ checked: true }} />

<!-- Disabled Switch -->
<Story name="Disabled" args={{ disabled: true }} />

<!-- Disabled Checked Switch -->
<Story name="Disabled Checked" args={{ checked: true, disabled: true }} />
