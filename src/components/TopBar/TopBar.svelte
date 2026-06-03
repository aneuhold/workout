<!--
  @component

  Top bar with app title, rest timer display, and user avatar dropdown.
  Static on mobile normally, fixed when timer active. Always fixed on desktop.
-->
<script lang="ts">
  import { IconLogout, IconSettings, IconStopwatch, IconUser } from '@tabler/icons-svelte';
  import { mode } from 'mode-watcher';
  import { goto } from '$app/navigation';
  import authService from '$services/AuthService';
  import timerService from '$services/TimerService';
  import Avatar from '$ui/Avatar/Avatar.svelte';
  import AvatarFallback from '$ui/Avatar/AvatarFallback.svelte';
  import Button from '$ui/Button/Button.svelte';
  import DropdownMenu from '$ui/DropdownMenu/DropdownMenu.svelte';
  import DropdownMenuContent from '$ui/DropdownMenu/DropdownMenuContent.svelte';
  import DropdownMenuItem from '$ui/DropdownMenu/DropdownMenuItem.svelte';
  import DropdownMenuSeparator from '$ui/DropdownMenu/DropdownMenuSeparator.svelte';
  import DropdownMenuTrigger from '$ui/DropdownMenu/DropdownMenuTrigger.svelte';
  import { formatTime } from '$util/formatTime';
  import SyncIndicator from './SyncIndicator.svelte';

  let { username = '', currentPath = '' }: { username?: string; currentPath?: string } = $props();

  const showTimerHighlight = $derived(timerService.isActive && currentPath !== '/timer');

  const logoSrc = $derived(mode.current === 'dark' ? '/logo-dark.svg' : '/logo-light.svg');

  const initials = $derived(
    username
      ? username
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : ''
  );

  async function handleLogout() {
    await authService.logout();
  }
</script>

<header
  class="[view-transition-name:match-element] backface-hidden z-40 flex h-(--top-nav-height) items-center bg-sidebar text-sidebar-foreground
    {showTimerHighlight ? 'fixed inset-x-0 top-0' : 'md:fixed md:inset-x-0 md:top-0'}"
>
  <!-- Logo: always sits in the sidebar bg -->
  <img src={logoSrc} alt="MesoPro logo" class="h-7 pr-1 pl-4" />

  <!-- Everything to the right of the logo. When the timer is active, this wraps
       into a left-rounded tab carrying the highlight, so the logo column stays
       consistent across pages. -->
  <div
    class="flex h-full flex-1 items-center justify-between pl-1 pr-4 {showTimerHighlight
      ? 'rounded-l-xl bg-primary text-primary-foreground animate-timer-pulse'
      : ''}"
  >
    <span class="text-lg font-semibold">MesoPro</span>

    {#if showTimerHighlight}
      <div class="flex items-center gap-1.5">
        <IconStopwatch size={18} stroke={1.5} />
        <span class="font-mono text-sm">{formatTime(timerService.remainingSeconds)}</span>
      </div>
    {/if}

    <div class="flex items-center gap-2">
      <SyncIndicator timerHighlight={showTimerHighlight} />
      <DropdownMenu>
        <DropdownMenuTrigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="icon"
              class="rounded-full"
              aria-label="User menu"
            >
              <Avatar>
                <AvatarFallback>
                  {#if initials}
                    {initials}
                  {:else}
                    <IconUser size={14} stroke={1.5} />
                  {/if}
                </AvatarFallback>
              </Avatar>
            </Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onclick={() => goto('/settings')}>
            <IconSettings size={16} />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onclick={handleLogout}>
            <IconLogout size={16} />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</header>
