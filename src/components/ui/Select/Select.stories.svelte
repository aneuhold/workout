<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createInvisibleArgTypes } from '$storybook/storybookUtil';
  import SBSelectExample from './SBSelectExample.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Select',
    component: SBSelectExample,
    argTypes: {
      ...createInvisibleArgTypes('value'),
      size: {
        control: { type: 'select' },
        options: ['default', 'sm']
      }
    },
    args: {
      options: [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'orange', label: 'Orange' }
      ]
    }
  });
</script>

<!-- Default Select -->
<Story name="Default" />

<!-- With Groups -->
<Story
  name="With Groups"
  args={{
    groups: [
      {
        label: 'Fruits',
        options: [
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana' },
          { value: 'orange', label: 'Orange' }
        ]
      },
      {
        label: 'Vegetables',
        options: [
          { value: 'carrot', label: 'Carrot' },
          { value: 'potato', label: 'Potato' },
          { value: 'tomato', label: 'Tomato' }
        ]
      }
    ],
    options: undefined
  }}
/>

<!-- Small Size -->
<Story name="Small Size" args={{ size: 'sm' }} />

<!-- Disabled Items -->
<Story
  name="Disabled Items"
  args={{
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2 (Disabled)', disabled: true },
      { value: 'option3', label: 'Option 3' }
    ]
  }}
/>

<!-- With Placeholder -->
<Story name="With Placeholder" args={{ placeholder: 'Select an option...' }} />
