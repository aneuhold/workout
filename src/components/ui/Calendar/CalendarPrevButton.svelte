<script lang="ts">
  import { IconChevronLeft } from '@tabler/icons-svelte';
  import { Calendar as CalendarPrimitive } from 'bits-ui';
  import { type ButtonVariant, buttonVariants } from '$ui/Button/Button.svelte';
  import { cn } from '$util/svelte-shadcn-util.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    variant = 'ghost',
    ...restProps
  }: CalendarPrimitive.PrevButtonProps & {
    variant?: ButtonVariant;
  } = $props();
</script>

{#snippet Fallback()}
  <IconChevronLeft class="size-4" />
{/snippet}

<CalendarPrimitive.PrevButton
  bind:ref
  class={cn(
    buttonVariants({ variant }),
    'size-(--cell-size) bg-transparent p-0 select-none disabled:opacity-50 rtl:rotate-180',
    className
  )}
  children={children || Fallback}
  {...restProps}
/>
