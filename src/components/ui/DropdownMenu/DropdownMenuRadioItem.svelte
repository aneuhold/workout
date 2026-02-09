<script lang="ts">
  import { IconCircleFilled } from '@tabler/icons-svelte';
  import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
  import { cn, type WithoutChild } from '$util/svelte-shadcn-util.js';

  let {
    ref = $bindable(null),
    class: className,
    inset,
    children: childrenProp,
    ...restProps
  }: WithoutChild<DropdownMenuPrimitive.RadioItemProps> & {
    inset?: boolean;
  } = $props();
</script>

<DropdownMenuPrimitive.RadioItem
  bind:ref
  data-slot="dropdown-menu-radio-item"
  data-inset={inset}
  class={cn(
    "focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-7 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    className
  )}
  {...restProps}
>
  {#snippet children({ checked })}
    <span class="pointer-events-none absolute start-2 flex size-3.5 items-center justify-center">
      {#if checked}
        <IconCircleFilled class="size-2 fill-current" />
      {/if}
    </span>
    {@render childrenProp?.({ checked })}
  {/snippet}
</DropdownMenuPrimitive.RadioItem>
