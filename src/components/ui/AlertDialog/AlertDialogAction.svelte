<script lang="ts" module>
  import { buttonVariants } from '$ui/Button/Button.svelte';

  const buttonVariantsDefaultClass: string = buttonVariants();
</script>

<script lang="ts">
  import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
  import { cn } from '$util/svelte-shadcn-util.js';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: AlertDialogPrimitive.ActionProps = $props();
</script>

<AlertDialogPrimitive.Action
  bind:ref
  data-slot="alert-dialog-action"
  class={cn(buttonVariantsDefaultClass, className)}
  {...restProps}
/>
