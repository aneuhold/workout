<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createInvisibleArgTypes } from '$storybook/storybookUtil';
  import SBTabsExample from './SBTabsExample.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Tabs',
    component: SBTabsExample,
    argTypes: {
      ...createInvisibleArgTypes('defaultValue'),
      orientation: {
        control: { type: 'select' },
        options: ['horizontal', 'vertical']
      },
      variant: {
        control: { type: 'select' },
        options: ['default', 'line']
      }
    },
    args: {
      tabs: [
        { value: 'account', label: 'Account', content: 'Account settings content goes here.' },
        { value: 'password', label: 'Password', content: 'Password settings content goes here.' },
        { value: 'settings', label: 'Settings', content: 'General settings content goes here.' }
      ]
    }
  });
</script>

<!-- Default Tabs -->
<Story name="Default" />

<!-- With Icons -->
<Story
  name="With Icons"
  args={{
    tabs: [
      { value: 'home', label: 'Home', content: 'Home content' },
      { value: 'profile', label: 'Profile', content: 'Profile content' },
      { value: 'settings', label: 'Settings', content: 'Settings content' }
    ],
    showIcons: true
  }}
/>

<!-- Line Variant -->
<Story
  name="Line Variant"
  args={{
    variant: 'line',
    tabs: [
      { value: 'tab1', label: 'Tab 1', content: 'Content for tab 1' },
      { value: 'tab2', label: 'Tab 2', content: 'Content for tab 2' },
      { value: 'tab3', label: 'Tab 3', content: 'Content for tab 3' }
    ]
  }}
/>

<!-- Vertical Orientation -->
<Story
  name="Vertical"
  args={{
    orientation: 'vertical',
    tabs: [
      { value: 'option1', label: 'Option 1', content: 'Content for option 1' },
      { value: 'option2', label: 'Option 2', content: 'Content for option 2' },
      { value: 'option3', label: 'Option 3', content: 'Content for option 3' }
    ]
  }}
/>

<!-- Vertical with Line Variant -->
<Story
  name="Vertical Line"
  args={{
    orientation: 'vertical',
    variant: 'line',
    tabs: [
      { value: 'opt1', label: 'Option 1', content: 'Content for option 1' },
      { value: 'opt2', label: 'Option 2', content: 'Content for option 2' },
      { value: 'opt3', label: 'Option 3', content: 'Content for option 3' }
    ]
  }}
/>
