<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createInvisibleArgTypes } from '$storybook/storybookUtil';
  import SBCalendarExample from './SBCalendarExample.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Calendar',
    component: SBCalendarExample,
    argTypes: {
      ...createInvisibleArgTypes('ref', 'value', 'placeholder', 'children'),
      captionLayout: {
        control: { type: 'select' },
        options: ['dropdown', 'dropdown-months', 'dropdown-years']
      },
      numberOfMonths: {
        control: { type: 'number', min: 1, max: 3 }
      }
    },
    args: {
      captionLayout: 'dropdown',
      numberOfMonths: 1
    }
  });
</script>

<!-- Default Calendar -->
<Story name="Default" />

<!-- Calendar with Month Dropdown Only -->
<Story name="Dropdown Months" args={{ captionLayout: 'dropdown-months' }} />

<!-- Calendar with Year Dropdown Only -->
<Story name="Dropdown Years" args={{ captionLayout: 'dropdown-years' }} />

<!-- Multiple Months -->
<Story name="Multiple Months" args={{ numberOfMonths: 2 }} />
