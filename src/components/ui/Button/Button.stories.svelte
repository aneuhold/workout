<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { IconChevronRight, IconLoader, IconMail } from '@tabler/icons-svelte';
  import { fn } from 'storybook/test';
  import { createInvisibleArgTypes } from '$storybook/storybookUtil';
  import Button from './Button.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Button',
    component: Button,
    argTypes: {
      ...createInvisibleArgTypes('ref', 'children'),
      variant: {
        control: { type: 'select' },
        options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link']
      },
      size: {
        control: { type: 'select' },
        options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg']
      }
    },
    args: {
      variant: 'default',
      size: 'default',
      onclick: fn()
    }
  });
</script>

<!-- Default Button -->
<Story name="Default">Button</Story>

<!-- Secondary Button -->
<Story name="Secondary" args={{ variant: 'secondary' }}>Secondary</Story>

<!-- Outline Button -->
<Story name="Outline" args={{ variant: 'outline' }}>Outline</Story>

<!-- Ghost Button -->
<Story name="Ghost" args={{ variant: 'ghost' }}>Ghost</Story>

<!-- Destructive Button -->
<Story name="Destructive" args={{ variant: 'destructive' }}>Destructive</Story>

<!-- Link Button -->
<Story name="Link" args={{ variant: 'link' }}>Link</Story>

<!-- Button with Icon -->
<Story name="With Icon">
  <IconMail data-icon="inline-start" />
  Login with Email
</Story>

<!-- Icon Only Button -->
<Story name="Icon Only" args={{ size: 'icon' }}>
  <IconChevronRight />
</Story>

<!-- Loading Button -->
<Story name="Loading" args={{ disabled: true }}>
  <IconLoader data-icon="inline-start" class="animate-spin" />
  Please wait
</Story>

<!-- Disabled Button -->
<Story name="Disabled" args={{ disabled: true }}>Disabled</Story>

<!-- Button as Link -->
<Story name="As Link" args={{ href: '/login' }}>Go to Login</Story>

<!-- Extra Small Size -->
<Story name="Extra Small" args={{ size: 'xs' }}>Extra Small</Story>

<!-- Small Size -->
<Story name="Small" args={{ size: 'sm' }}>Small</Story>

<!-- Large Size -->
<Story name="Large" args={{ size: 'lg' }}>Large</Story>
