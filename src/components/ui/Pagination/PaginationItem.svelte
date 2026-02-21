<script lang="ts">
  import type { HTMLLiAttributes } from 'svelte/elements';
  import type { WithElementRef } from '$util/svelte-shadcn-util.js';

  let {
    ref = $bindable(null),
    children,
    ...restProps
  }: WithElementRef<HTMLLiAttributes> = $props();
</script>

<li bind:this={ref} data-slot="pagination-item" {...restProps}>
  {@render children?.()}
</li>
