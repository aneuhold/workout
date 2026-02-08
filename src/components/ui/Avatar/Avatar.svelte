<script lang="ts">
  import { Avatar as AvatarPrimitive } from 'bits-ui';
  import { cn } from '$util/svelte-shadcn-util.js';

  type Size = 'sm' | 'default' | 'lg';

  let {
    ref = $bindable(null),
    loadingStatus = $bindable('loading'),
    class: className,
    size = 'default',
    ...restProps
  }: AvatarPrimitive.RootProps & { size?: Size } = $props();
</script>

<AvatarPrimitive.Root
  bind:ref
  bind:loadingStatus
  data-slot="avatar"
  data-size={size}
  class={cn(
    'after:border-border group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten',
    className
  )}
  {...restProps}
/>
