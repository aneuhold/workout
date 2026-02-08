<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createEnumArgType, createInvisibleArgTypes } from '$storybook/storybookUtil';
  import SBTableExample, { SBTableExampleDemoType } from './SBTableExample.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Table',
    component: SBTableExample,
    argTypes: {
      ...createInvisibleArgTypes('ref', 'children'),
      demo: createEnumArgType(SBTableExampleDemoType),
      showCaption: {
        control: { type: 'boolean' }
      },
      showFooter: {
        control: { type: 'boolean' }
      },
      compact: {
        control: { type: 'boolean' }
      }
    },
    args: {
      demo: SBTableExampleDemoType.Invoices,
      showCaption: true,
      showFooter: false,
      compact: false
    }
  });
</script>

<!-- Basic Table -->
<Story name="Default" args={{ demo: SBTableExampleDemoType.Invoices, showCaption: true }} />

<!-- Table with Footer -->
<Story name="With Footer" args={{ demo: SBTableExampleDemoType.Items, showFooter: true }} />

<!-- Simple Table -->
<Story name="Simple" args={{ demo: SBTableExampleDemoType.Users, showCaption: false }} />

<!-- Compact Table -->
<Story
  name="Compact"
  args={{ demo: SBTableExampleDemoType.Invoices, compact: true, showCaption: false }}
/>
