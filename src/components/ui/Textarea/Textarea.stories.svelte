<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createInvisibleArgTypes, createTextArgTypes } from '$storybook/storybookUtil';
  import Textarea from './Textarea.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Textarea',
    component: Textarea,
    argTypes: {
      ...createInvisibleArgTypes('ref'),
      ...createTextArgTypes('placeholder')
    },
    args: {
      placeholder: 'Type your message here...'
    }
  });
</script>

<!-- Default Textarea -->
<Story name="Default" />

<!-- With Value -->
<Story name="With Value" args={{ value: 'This is a sample text in the textarea.' }} />

<!-- Disabled Textarea -->
<Story name="Disabled" args={{ disabled: true, value: 'This textarea is disabled' }} />

<!-- Invalid Textarea -->
<Story name="Invalid" args={{ 'aria-invalid': 'true', placeholder: 'This field has an error' }} />

<!-- With Rows -->
<Story name="Custom Rows" args={{ rows: 10, placeholder: 'A taller textarea with 10 rows' }} />
