<!--
  @component

  A small info icon button that opens a popover with explanatory text.
  Use this to provide contextual help for confusing or complex concepts.
-->
<script lang="ts">
  import { IconInfoCircle } from '@tabler/icons-svelte';
  import type { Snippet } from 'svelte';
  import Popover from '$ui/Popover/Popover.svelte';
  import PopoverContent from '$ui/Popover/PopoverContent.svelte';
  import PopoverTrigger from '$ui/Popover/PopoverTrigger.svelte';

  let {
    children,
    size = 16
  }: {
    children: Snippet;
    size?: number;
  } = $props();
</script>

<Popover>
  <PopoverTrigger>
    <IconInfoCircle {size} class="text-muted-foreground" />
  </PopoverTrigger>
  <PopoverContent>
    <div class="text-sm">
      {@render children()}
    </div>
  </PopoverContent>
</Popover>
