<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    createBoolArgTypes,
    createInvisibleArgTypes,
    createNumberArgTypes,
    createTextArgTypes
  } from '$storybook/storybookUtil';
  import ValidatedInput from './ValidatedInput.svelte';

  const { Story } = defineMeta({
    title: 'Components/ValidatedInput',
    component: ValidatedInput,
    argTypes: {
      ...createTextArgTypes('placeholder'),
      ...createBoolArgTypes('required'),
      ...createNumberArgTypes('min', 'max', 'minlength', 'maxlength'),
      ...createInvisibleArgTypes('value'),
      type: {
        control: { type: 'select' },
        options: ['text', 'number', 'email', 'search', 'tel', 'url']
      }
    },
    args: {
      type: 'text',
      placeholder: 'Enter text...'
    }
  });
</script>

<!-- Default text input -->
<Story name="Default" />

<!-- Required text — shows error when cleared -->
<Story name="Required Text" args={{ required: true, placeholder: 'Required field...' }} />

<!-- Number with min/max -->
<Story name="Number" args={{ type: 'number', value: 5, min: 1, max: 10, placeholder: '1-10' }} />

<!-- Number with no bounds -->
<Story name="Number No Bounds" args={{ type: 'number', value: 42, placeholder: 'Any number...' }} />

<!-- Weeks Config (mesocycle use case) -->
<Story
  name="Weeks Config"
  args={{ type: 'number', value: 6, min: 2, max: 8, placeholder: 'Weeks' }}
/>
