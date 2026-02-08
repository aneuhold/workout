<script lang="ts">
  import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
  import type { ComponentProps } from 'svelte';
  import { cn, type WithoutChild, type WithoutChildrenOrChild } from '$util/svelte-shadcn-util.js';
  import AlertDialogOverlay from './AlertDialogOverlay.svelte';
  import AlertDialogPortal from './AlertDialogPortal.svelte';

  let {
    ref = $bindable(null),
    class: className,
    portalProps,
    ...restProps
  }: WithoutChild<AlertDialogPrimitive.ContentProps> & {
    portalProps?: WithoutChildrenOrChild<ComponentProps<typeof AlertDialogPortal>>;
  } = $props();
</script>

<AlertDialogPortal {...portalProps}>
  <AlertDialogOverlay />
  <AlertDialogPrimitive.Content
    bind:ref
    data-slot="alert-dialog-content"
    class={cn(
      'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 bg-background ring-foreground/10 fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl p-4 ring-1 duration-100 outline-none max-w-xs sm:max-w-sm',
      className
    )}
    {...restProps}
  />
</AlertDialogPortal>
