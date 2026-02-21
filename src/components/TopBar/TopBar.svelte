<!--
  @component

  Top bar with app title, rest timer display, and user avatar dropdown.
  Static on mobile normally, fixed when timer active. Always fixed on desktop.
-->
<script lang="ts">
  import { IconLogout, IconSettings, IconStopwatch, IconUser } from '@tabler/icons-svelte';
  import { goto } from '$app/navigation';
  import timerService from '$services/TimerService';
  import { userConfig } from '$stores/local/userConfig/userConfig';
  import { LoginState, loginState } from '$stores/session/loginState';
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

  function handleLogout() {
    userConfig.clear();
    loginState.set(LoginState.LoggedOut);
  }
</script>

<header
  class="z-40 flex h-(--top-nav-height) items-center justify-between px-4
    {showTimerHighlight
    ? 'fixed inset-x-0 top-0 bg-primary text-primary-foreground animate-timer-pulse'
    : 'bg-sidebar text-sidebar-foreground md:fixed md:inset-x-0 md:top-0'}"
>
  <!-- Left: Logo + App title -->
  <div class="flex items-center gap-2">
    <img
      src="/logo.svg"
      alt="MesoPro logo"
      class="h-7 {showTimerHighlight ? 'brightness-0 invert dark:invert' : ''}"
    />
    <span class="text-lg font-semibold">MesoPro</span>
  </div>

  <!-- Center: Timer display (only when active) -->
  {#if showTimerHighlight}
    <div class="flex items-center gap-1.5">
      <IconStopwatch size={18} stroke={1.5} />
      <span class="font-mono text-sm">{formatTime(timerService.remainingSeconds)}</span>
    </div>
  {/if}

  <!-- Right: Sync indicator + Avatar dropdown -->
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
</header>
