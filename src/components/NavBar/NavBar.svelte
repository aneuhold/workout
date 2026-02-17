<!--
  @component

  Responsive navigation bar. Renders as a fixed bottom bar on mobile and a
  fixed left sidebar on desktop (md breakpoint).
-->
<script lang="ts">
  import {
    type Icon,
    IconBarbell,
    IconCalendar,
    IconChartBar,
    IconHome,
    IconList,
    IconStopwatch
  } from '@tabler/icons-svelte';
  import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
  import { navBarItems } from '$util/navInfo';

  let { currentPath }: { currentPath: string } = $props();

  const iconMap: Record<string, Icon> = {
    IconHome,
    IconBarbell,
    IconList,
    IconChartBar,
    IconCalendar,
    IconStopwatch
  };

  function getHref(itemUrl: string): string {
    if (itemUrl === '/sessions' && mesocycleMapService.activeAndNextSessions.inProgressSession) {
      return `/session?sessionId=${mesocycleMapService.activeAndNextSessions.inProgressSession._id}`;
    }
    return itemUrl;
  }

  function isActive(itemUrl: string, path: string): boolean {
    if (itemUrl === '/') return path === '/';
    if (itemUrl === '/sessions') return path.startsWith('/session');
    return path.startsWith(itemUrl);
  }
</script>

<nav
  class="bg-sidebar border-sidebar-border fixed bottom-0 left-0 flex w-full border-t md:top-12 md:h-[calc(100vh-3rem)] md:w-48 md:flex-col md:border-t-0 md:border-r"
>
  {#each navBarItems as item (item.url)}
    <a
      href={getHref(item.url)}
      class="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors
        md:flex-initial md:flex-row md:items-center md:justify-start md:gap-3 md:rounded-md md:px-3 md:py-2.5
        {isActive(item.url, currentPath)
        ? 'text-primary md:bg-sidebar-accent'
        : 'text-sidebar-foreground/60 hover:text-sidebar-foreground md:hover:bg-sidebar-accent/50'}"
    >
      {#if item.iconName && iconMap[item.iconName]}
        {@const Icon = iconMap[item.iconName]}
        <Icon size={24} stroke={1.5} />
      {/if}
      <span class="text-[10px] leading-tight md:text-sm">{item.shortTitle}</span>
    </a>
  {/each}
</nav>
