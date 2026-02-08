<script lang="ts">
  import { IconChevronRight } from '@tabler/icons-svelte';
  import { Calendar as CalendarPrimitive } from 'bits-ui';
  import { type ButtonVariant, buttonVariants } from '$ui/Button/Button.svelte';
  import { cn } from '$util/svelte-shadcn-util.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    variant = 'ghost',
    ...restProps
  }: CalendarPrimitive.NextButtonProps & {
    variant?: ButtonVariant;
  } = $props();
</script>

{#snippet Fallback()}
  <IconChevronRight class="size-4" />
{/snippet}

<CalendarPrimitive.NextButton
  bind:ref
  class={cn(
    buttonVariants({ variant }),
    'size-(--cell-size) bg-transparent p-0 select-none disabled:opacity-50 rtl:rotate-180',
    className
  )}
  children={children || Fallback}
  {...restProps}
/>
