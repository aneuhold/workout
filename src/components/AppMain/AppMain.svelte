<!--
  @component

  Main content area of the authenticated app. Reserves space for the TopBar
  and NavBar, including top padding on mobile while the rest timer is active,
  since the TopBar becomes fixed then. On desktop the TopBar is always fixed.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { timerPageInfo } from '$routes/(app)/timer/pageInfo';
  import timerService from '$services/TimerService';
  import { cn } from '$util/svelte-shadcn-util';

  let {
    currentPath,
    children
  }: {
    /** Path of the current route, used to detect the timer page. */
    currentPath: string;
    children?: Snippet;
  } = $props();

  const isTopBarFixed = $derived(timerService.isActive && currentPath !== timerPageInfo.url);
</script>

<main
  class={cn(
    '[view-transition-name:main-content] md:pt-top-nav pb-bottom-nav md:pb-0 md:pl-48',
    isTopBarFixed && 'pt-top-nav'
  )}
>
  {@render children?.()}
</main>
