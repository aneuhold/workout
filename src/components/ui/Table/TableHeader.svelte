<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '$util/svelte-shadcn-util.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLTableSectionElement>> = $props();
</script>

<thead
  bind:this={ref}
  data-slot="table-header"
  class={cn('[&_tr]:border-b', className)}
  {...restProps}
>
  {@render children?.()}
</thead>
