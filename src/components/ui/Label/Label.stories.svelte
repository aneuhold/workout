<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createInvisibleArgTypes } from '$storybook/storybookUtil';
  import Label from './Label.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Label',
    component: Label,
    argTypes: {
      ...createInvisibleArgTypes('ref')
    }
  });
</script>

<!-- Default Label -->
<Story name="Default">Your email address</Story>

<!-- Label with For Attribute -->
<Story name="With For" args={{ for: 'email' }}>Email</Story>
