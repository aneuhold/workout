<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createTextArgTypes } from '$storybook/storybookUtil';
  import SBDropdownMenuExample from './SBDropdownMenuExample.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/DropdownMenu',
    component: SBDropdownMenuExample,
    argTypes: {
      ...createTextArgTypes('triggerText'),
      menuType: {
        control: { type: 'select' },
        options: ['simple', 'with-groups', 'with-checkboxes', 'with-radio', 'with-submenu']
      }
    },
    args: {
      menuType: 'simple',
      triggerText: 'Open Menu'
    }
  });
</script>

<!-- Simple Menu -->
<Story name="Simple" />

<!-- With Groups -->
<Story name="With Groups" args={{ menuType: 'with-groups' }} />

<!-- With Checkboxes -->
<Story name="With Checkboxes" args={{ menuType: 'with-checkboxes' }} />

<!-- With Radio Group -->
<Story name="With Radio Group" args={{ menuType: 'with-radio' }} />

<!-- With Submenu -->
<Story name="With Submenu" args={{ menuType: 'with-submenu' }} />
