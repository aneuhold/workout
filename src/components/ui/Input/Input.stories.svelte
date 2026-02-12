<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createInvisibleArgTypes, createTextArgTypes } from '$storybook/storybookUtil';
  import Input from './Input.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Input',
    component: Input,
    argTypes: {
      ...createInvisibleArgTypes('ref', 'files'),
      ...createTextArgTypes('placeholder'),
      type: {
        control: { type: 'select' },
        options: [
          'text',
          'email',
          'password',
          'number',
          'tel',
          'url',
          'search',
          'date',
          'time',
          'file'
        ]
      }
    },
    args: {
      type: 'text',
      placeholder: 'Enter text...'
    }
  });
</script>

<!-- Default Input -->
<Story name="Default" />

<!-- Email Input -->
<Story name="Email" args={{ type: 'email', placeholder: 'Enter email...' }} />

<!-- Password Input -->
<Story name="Password" args={{ type: 'password', placeholder: 'Enter password...' }} />

<!-- Number Input -->
<Story name="Number" args={{ type: 'number', placeholder: 'Enter number...' }} />

<!-- Disabled Input -->
<Story name="Disabled" args={{ disabled: true, value: 'Disabled input' }} />

<!-- Invalid Input -->
<Story name="Invalid" args={{ 'aria-invalid': 'true', placeholder: 'Invalid input' }} />

<!-- File Input -->
<Story name="File" args={{ type: 'file' }} />

<!-- Search Input -->
<Story name="Search" args={{ type: 'search', placeholder: 'Search...' }} />
