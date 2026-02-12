<script lang="ts">
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import { cn } from '$util/svelte-shadcn-util.js';

  type Orientation = 'horizontal' | 'vertical';

  let {
    ref = $bindable(null),
    value = $bindable(''),
    class: className,
    orientation = 'horizontal',
    ...restProps
  }: TabsPrimitive.RootProps & { orientation?: Orientation } = $props();
</script>

<TabsPrimitive.Root
  bind:ref
  bind:value
  data-slot="tabs"
  data-orientation={orientation}
  class={cn('group/tabs flex gap-2 data-[orientation=horizontal]:flex-col', className)}
  {...restProps}
/>
