<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '$util/svelte-shadcn-util.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="dialog-footer"
  class={cn(
    '-mx-4 -mb-4 mt-auto flex flex-col-reverse gap-3 border-t p-4 sm:flex-row sm:justify-end',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>
