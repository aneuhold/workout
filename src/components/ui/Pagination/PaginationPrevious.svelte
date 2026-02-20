<script lang="ts">
  import { IconChevronLeft } from '@tabler/icons-svelte';
  import { Pagination as PaginationPrimitive } from 'bits-ui';
  import { buttonVariants } from '$ui/Button/Button.svelte';
  import { cn } from '$util/svelte-shadcn-util.js';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: PaginationPrimitive.PrevButtonProps = $props();
</script>

<PaginationPrimitive.PrevButton
  bind:ref
  aria-label="Go to previous page"
  class={cn(
    buttonVariants({
      size: 'default',
      variant: 'ghost',
      class: 'pl-1.5'
    }),
    className
  )}
  {...restProps}
>
  <IconChevronLeft data-icon="inline-start" size={16} />
  <span class="hidden sm:block">Previous</span></PaginationPrimitive.PrevButton
>
