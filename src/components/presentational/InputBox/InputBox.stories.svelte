<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { fn } from 'storybook/test';
  import {
    createBoolArgTypes,
    createInvisibleArgTypes,
    createNumberArgTypes,
    createTextArgTypes
  } from '$storybook/storybookUtil';
  import SBInputBoxExample from './SBInputBoxExample.svelte';

  const { Story } = defineMeta({
    title: 'Presentational Components/InputBox',
    component: SBInputBoxExample,
    argTypes: {
      ...createInvisibleArgTypes('onSubmit', 'autocompleteLabel'),
      ...createTextArgTypes('label', 'inputType', 'helperText'),
      ...createBoolArgTypes('isTextArea', 'spellCheck', 'isValid'),
      ...createNumberArgTypes('min', 'max'),
      variant: {
        control: { type: 'select' },
        options: ['filled', 'outlined', 'standard']
      }
    },
    args: {
      initialValue: '',
      disable: false,
      isSmall: false,
      onSubmit: fn()
    }
  });
</script>

<!-- Basic Text Input -->
<Story
  name="Basic Text Input"
  args={{
    label: 'Enter text',
    inputType: 'text',
    variant: 'standard'
  }}
/>

<!-- Text Area -->
<Story
  name="Text Area"
  args={{
    label: 'Enter description',
    isTextArea: true,
    initialValue: 'This is a\nmulti-line\ntext area'
  }}
/>

<!-- Number Input -->
<Story
  name="Number Input"
  args={{
    inputType: 'number',
    min: 0,
    max: 100,
    initialValue: 10
  }}
/>

<!-- Password Input -->
<Story
  name="Password Input"
  args={{
    label: 'Enter password',
    inputType: 'password',
    autocompleteLabel: 'current-password'
  }}
/>

<!-- With Helper Text -->
<Story
  name="With Helper Text"
  args={{
    label: 'Username',
    helperText: 'Enter your username (3-20 characters)',
    variant: 'outlined'
  }}
/>

<!-- Small Input -->
<Story
  name="Small Input"
  args={{
    label: 'Qty',
    inputType: 'number',
    isSmall: true,
    initialValue: 1
  }}
/>

<!-- Disabled -->
<Story
  name="Disabled"
  args={{
    label: 'Disabled field',
    disable: true,
    initialValue: 'Cannot edit this'
  }}
/>

<!-- Invalid State -->
<Story
  name="Invalid State"
  args={{
    label: 'Required field',
    isValid: false,
    helperText: 'This field is required'
  }}
/>

<!-- Different Variants -->
<Story
  name="Filled Variant"
  args={{
    label: 'Filled input',
    variant: 'filled',
    initialValue: 'Example text'
  }}
/>
