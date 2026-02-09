<script lang="ts">
  import { IconX } from '@tabler/icons-svelte';
  import { Dialog as SheetPrimitive } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { ComponentProps } from 'svelte';
  import { cn, type WithoutChildrenOrChild } from '$util/svelte-shadcn-util.js';
  import SheetOverlay from './SheetOverlay.svelte';
  import SheetPortal from './SheetPortal.svelte';

  type Side = 'top' | 'right' | 'bottom' | 'left';

  let {
    ref = $bindable(null),
    class: className,
    side = 'right',
    portalProps,
    children,
    ...restProps
  }: WithoutChildrenOrChild<SheetPrimitive.ContentProps> & {
    portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SheetPortal>>;
    side?: Side;
    children: Snippet;
  } = $props();
</script>

<SheetPortal {...portalProps}>
  <SheetOverlay />
  <SheetPrimitive.Content
    bind:ref
    data-slot="sheet-content"
    data-side={side}
    class={cn(
      'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[side=right]:data-[state=closed]:slide-out-to-right-10 data-[side=right]:data-[state=open]:slide-in-from-right-10 data-[side=left]:data-[state=closed]:slide-out-to-left-10 data-[side=left]:data-[state=open]:slide-in-from-left-10 data-[side=top]:data-[state=closed]:slide-out-to-top-10 data-[side=top]:data-[state=open]:slide-in-from-top-10 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[side=bottom]:data-[state=closed]:slide-out-to-bottom-10 data-[side=bottom]:data-[state=open]:slide-in-from-bottom-10 fixed z-50 flex flex-col gap-4 bg-clip-padding text-sm shadow-lg transition duration-200 ease-in-out data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm',
      className
    )}
    {...restProps}
  >
    {@render children()}
    <SheetPrimitive.Close
      class="ring-offset-background focus-visible:ring-ring absolute end-4 top-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none"
    >
      <IconX class="size-4" />
      <span class="sr-only">Close</span>
    </SheetPrimitive.Close>
  </SheetPrimitive.Content>
</SheetPortal>
