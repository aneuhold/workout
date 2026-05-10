<!--
  @component

  Ghost-style back button for page headers. Defaults to navigating back
  via `history.back()`; pass `onclick` to override (e.g. `goto` to a
  specific URL). Optional children render as a label next to the icon.
-->
<script lang="ts">
  import { IconArrowLeft } from '@tabler/icons-svelte';
  import type { Snippet } from 'svelte';
  import Button from '$ui/Button/Button.svelte';

  let {
    class: className,
    onclick,
    children
  }: {
    class?: string;
    onclick?: () => void;
    children?: Snippet;
  } = $props();

  const handleClick = () => {
    if (onclick) {
      onclick();
    } else {
      history.back();
    }
  };
</script>

<Button variant="ghost" size="sm" class={className} onclick={handleClick}>
  <IconArrowLeft size={16} />
  {@render children?.()}
</Button>
