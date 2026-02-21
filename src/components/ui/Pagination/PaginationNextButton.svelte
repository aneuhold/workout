<script lang="ts">
  import { IconChevronRight } from '@tabler/icons-svelte';
  import { Pagination as PaginationPrimitive } from 'bits-ui';
  import { buttonVariants } from '$ui/Button/Button.svelte';
  import { cn } from '$util/svelte-shadcn-util.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: PaginationPrimitive.NextButtonProps = $props();
</script>

{#snippet Fallback()}
  <span>Next</span>
  <IconChevronRight data-icon="inline-end" size={16} />
{/snippet}

<PaginationPrimitive.NextButton
  bind:ref
  aria-label="Go to next page"
  class={cn(
    buttonVariants({
      size: 'default',
      variant: 'ghost',
      class: 'pr-1.5'
    }),
    className
  )}
  children={children || Fallback}
  {...restProps}
/>
