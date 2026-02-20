<script lang="ts">
  import { IconChevronLeft } from '@tabler/icons-svelte';
  import { Pagination as PaginationPrimitive } from 'bits-ui';
  import { buttonVariants } from '$ui/Button/Button.svelte';
  import { cn } from '$util/svelte-shadcn-util.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: PaginationPrimitive.PrevButtonProps = $props();
</script>

{#snippet Fallback()}
  <IconChevronLeft data-icon="inline-start" size={16} />
  <span>Previous</span>
{/snippet}

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
  children={children || Fallback}
  {...restProps}
/>
