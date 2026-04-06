<!--
  @component

  Standardized "Options" dropdown button used across the app for overflow menus.
  Renders a DropdownMenu with an outline "Options" button trigger and accepts
  menu items as children.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from '$ui/Button/Button.svelte';
  import DropdownMenu from '$ui/DropdownMenu/DropdownMenu.svelte';
  import DropdownMenuContent from '$ui/DropdownMenu/DropdownMenuContent.svelte';
  import DropdownMenuTrigger from '$ui/DropdownMenu/DropdownMenuTrigger.svelte';

  let {
    children,
    align = 'end',
    ariaLabel = 'Options'
  }: {
    children: Snippet;
    align?: 'start' | 'center' | 'end';
    ariaLabel?: string;
  } = $props();
</script>

<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline" size="sm" aria-label={ariaLabel}>Options</Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent {align}>
    {@render children()}
  </DropdownMenuContent>
</DropdownMenu>
