<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { IconEye, IconLock, IconMail, IconSearch } from '@tabler/icons-svelte';
  import { createInvisibleArgTypes } from '$storybook/storybookUtil';
  import InputGroupAddon from './InputGroupAddon.svelte';
  import InputGroupButton from './InputGroupButton.svelte';
  import InputGroupInput from './InputGroupInput.svelte';
  import InputGroupRoot from './InputGroupRoot.svelte';
  import InputGroupText from './InputGroupText.svelte';
  import InputGroupTextarea from './InputGroupTextarea.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/InputGroup',
    component: InputGroupRoot,
    argTypes: {
      ...createInvisibleArgTypes('ref')
    }
  });
</script>

<!-- Basic Input Group with text addon -->
<Story name="Default">
  <InputGroupAddon>
    <InputGroupText>$</InputGroupText>
  </InputGroupAddon>
  <InputGroupInput placeholder="0.00" />
</Story>

<!-- Search Input with Icon -->
<Story name="Search with Icon">
  <InputGroupAddon>
    <IconSearch />
  </InputGroupAddon>
  <InputGroupInput placeholder="Search..." />
</Story>

<!-- Currency Input with Both Sides -->
<Story name="Currency Input">
  <InputGroupAddon>
    <InputGroupText>$</InputGroupText>
  </InputGroupAddon>
  <InputGroupInput placeholder="0.00" />
  <InputGroupAddon align="inline-end">
    <InputGroupText>USD</InputGroupText>
  </InputGroupAddon>
</Story>

<!-- Email Input with Icon -->
<Story name="Email Input">
  <InputGroupAddon>
    <IconMail />
  </InputGroupAddon>
  <InputGroupInput type="email" placeholder="you@example.com" />
</Story>

<!-- Password Input with Toggle Button -->
<Story name="Password with Button">
  <InputGroupAddon>
    <IconLock />
  </InputGroupAddon>
  <InputGroupInput type="password" placeholder="Enter password" />
  <InputGroupAddon align="inline-end">
    <InputGroupButton variant="ghost" size="icon-xs">
      <IconEye />
    </InputGroupButton>
  </InputGroupAddon>
</Story>

<!-- With Action Button -->
<Story name="With Action Button">
  <InputGroupInput placeholder="Type to search..." />
  <InputGroupAddon align="inline-end">
    <InputGroupButton variant="secondary">Search</InputGroupButton>
  </InputGroupAddon>
</Story>

<!-- With Textarea -->
<Story name="With Textarea">
  <InputGroupAddon align="block-start">
    <InputGroupText>Comment</InputGroupText>
  </InputGroupAddon>
  <InputGroupTextarea placeholder="Write your comment..." />
</Story>

<!-- Block Start Addon -->
<Story name="Block Start Addon">
  <InputGroupAddon align="block-start">
    <InputGroupText>Title</InputGroupText>
  </InputGroupAddon>
  <InputGroupInput placeholder="Enter a title..." />
</Story>

<!-- Block End Addon -->
<Story name="Block End Addon">
  <InputGroupInput placeholder="Enter text..." />
  <InputGroupAddon align="block-end">
    <InputGroupText>0/500 characters</InputGroupText>
  </InputGroupAddon>
</Story>
