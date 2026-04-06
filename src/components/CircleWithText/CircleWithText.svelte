<!--
  @component

  A small circle with centered text, typically used for numbered indicators.
-->
<script lang="ts">
  import { cn } from '$util/svelte-shadcn-util';

  let {
    text,
    class: className
  }: {
    text: string | number;
    class?: string;
  } = $props();
</script>

<span
  class={cn(
    'flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground',
    className
  )}
>
  {text}
</span>
