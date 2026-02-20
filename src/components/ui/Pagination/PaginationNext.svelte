<script lang="ts">
  import { IconChevronRight } from '@tabler/icons-svelte';
  import { Pagination as PaginationPrimitive } from 'bits-ui';
  import { buttonVariants } from '$ui/Button/Button.svelte';
  import { cn } from '$util/svelte-shadcn-util.js';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: PaginationPrimitive.NextButtonProps = $props();
</script>

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
  {...restProps}
>
  <span class="hidden sm:block">Next</span>
  <IconChevronRight data-icon="inline-end" size={16} /></PaginationPrimitive.NextButton
>
