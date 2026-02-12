<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { IconAlertCircle, IconInfoCircle } from '@tabler/icons-svelte';
  import { createInvisibleArgTypes } from '$storybook/storybookUtil';
  import Alert from './Alert.svelte';
  import AlertDescription from './AlertDescription.svelte';
  import AlertTitle from './AlertTitle.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Alert',
    component: Alert,
    argTypes: {
      ...createInvisibleArgTypes('ref', 'children'),
      variant: {
        control: { type: 'select' },
        options: ['default', 'destructive']
      }
    },
    args: {
      variant: 'default'
    }
  });
</script>

<!-- Basic Alert -->
<Story name="Default">
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>You can add components to your app using the cli.</AlertDescription>
</Story>

<!-- Alert with Icon -->
<Story name="With Icon">
  <IconInfoCircle />
  <AlertTitle>Information</AlertTitle>
  <AlertDescription>This is an informational alert with an icon.</AlertDescription>
</Story>

<!-- Destructive Alert -->
<Story name="Destructive" args={{ variant: 'destructive' }}>
  <IconAlertCircle />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
</Story>

<!-- Simple Alert (Title Only) -->
<Story name="Title Only">
  <AlertTitle>Simple notification</AlertTitle>
</Story>

<!-- Alert with Description Only -->
<Story name="Description Only">
  <AlertDescription>This alert only contains a description without a title.</AlertDescription>
</Story>
