<script lang="ts" module>
  import { buttonVariants } from '$ui/Button/Button.svelte';

  // Added this way because the type of `tv` derived functions is kind of nuts.
  const alertDialogCancelClass: string = buttonVariants({ variant: 'outline' });
</script>

<script lang="ts">
  import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
  import { cn } from '$util/svelte-shadcn-util.js';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: AlertDialogPrimitive.CancelProps = $props();
</script>

<AlertDialogPrimitive.Cancel
  bind:ref
  data-slot="alert-dialog-cancel"
  class={cn(alertDialogCancelClass, className)}
  {...restProps}
/>
