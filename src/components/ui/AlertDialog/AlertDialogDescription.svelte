<script lang="ts">
  import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
  import { cn } from '$util/svelte-shadcn-util.js';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: AlertDialogPrimitive.DescriptionProps = $props();
</script>

<AlertDialogPrimitive.Description
  bind:ref
  data-slot="alert-dialog-description"
  class={cn(
    'text-muted-foreground text-sm text-balance md:text-pretty *:[a]:hover:text-foreground *:[a]:underline *:[a]:underline-offset-3',
    className
  )}
  {...restProps}
/>
