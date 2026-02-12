<script lang="ts">
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import { cn } from '$util/svelte-shadcn-util.js';

  type Variant = 'default' | 'line';

  let {
    ref = $bindable(null),
    class: className,
    variant = 'default',
    ...restProps
  }: TabsPrimitive.ListProps & { variant?: Variant } = $props();
</script>

<TabsPrimitive.List
  bind:ref
  data-slot="tabs-list"
  data-variant={variant}
  class={cn(
    'rounded-lg p-0.75 group-data-[orientation=horizontal]/tabs:h-8 data-[variant=line]:rounded-none group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col',
    variant === 'default' && 'bg-muted',
    variant === 'line' && 'gap-1 bg-transparent',
    className
  )}
  {...restProps}
/>
