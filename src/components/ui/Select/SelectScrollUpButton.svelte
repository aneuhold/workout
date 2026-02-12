<script lang="ts">
  import { IconChevronUp } from '@tabler/icons-svelte';
  import { Select as SelectPrimitive } from 'bits-ui';
  import { cn, type WithoutChildrenOrChild } from '$util/svelte-shadcn-util.js';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<SelectPrimitive.ScrollUpButtonProps> = $props();
</script>

<SelectPrimitive.ScrollUpButton
  bind:ref
  data-slot="select-scroll-up-button"
  class={cn(
    "bg-popover top-0 z-10 flex w-full cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4",
    className
  )}
  {...restProps}
>
  <IconChevronUp class="size-4" />
</SelectPrimitive.ScrollUpButton>
