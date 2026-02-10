<!--
  @component

  The root of the application. Handles login state, global styles, and the
  persistent navigation bar.
-->
<script lang="ts">
  import '../globalStyles/global.css';
  import {
    IconBarbell,
    IconCalendarEvent,
    IconChartLine,
    IconClock,
    IconHome,
    IconList,
    IconX
  } from '@tabler/icons-svelte';
  import { ModeWatcher } from 'mode-watcher';
  import { onDestroy, onMount, type Snippet } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { appIsVisible } from '$stores/session/appIsVisible';
  import { LoginState, loginState } from '$stores/session/loginState';
  import Button from '$ui/Button/Button.svelte';
  import Progress from '$ui/Progress/Progress.svelte';

  let { children }: { children?: Snippet } = $props();

  let mounted = $state(false);

  // Timer state
  let timerRunning = $state(false);
  let timerSeconds = $state(0);
  let timerDuration = $state(90);
  let timerInterval: ReturnType<typeof setInterval> | null = $state(null);
  let timerExpanded = $state(false);

  const timerDisplay = $derived(() => {
    const remaining = Math.max(0, timerDuration - timerSeconds);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });

  const timerProgress = $derived(() => {
    if (timerDuration === 0) return 0;
    return Math.min(100, (timerSeconds / timerDuration) * 100);
  });

  const startTimer = (seconds: number) => {
    timerDuration = seconds;
    timerSeconds = 0;
    timerRunning = true;
    timerExpanded = false;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timerSeconds++;
      if (timerSeconds >= timerDuration) {
        stopTimer();
      }
    }, 1000);
  };

  const stopTimer = () => {
    timerRunning = false;
    timerSeconds = 0;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  const navItems = [
    { href: '/', label: 'Home', icon: IconHome },
    { href: '/session/demo', label: 'Session', icon: IconBarbell },
    { href: '/exercises', label: 'Exercises', icon: IconList },
    { href: '/analytics', label: 'Analytics', icon: IconChartLine },
    { href: '/plan', label: 'Plan', icon: IconCalendarEvent }
  ];

  onMount(() => {
    mounted = true;
  });

  const handleVisibilityChange = () => {
    appIsVisible.set(document.visibilityState === 'visible');
  };

  if (browser) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
    if (timerInterval) clearInterval(timerInterval);
  });
</script>

<ModeWatcher />
<div class="app">
  {#if !mounted || $loginState === LoginState.Initializing}
    <div class="flex h-dvh items-center justify-center">
      <p class="text-muted-foreground animate-pulse text-lg">Loading...</p>
    </div>
  {:else if $loginState === LoginState.ProcessingCredentials || $loginState === LoginState.LoggedOut}
    Login should be here
  {:else}
    <!-- Desktop: sidebar left + content. Mobile: content + bottom bar -->
    <div class="flex h-dvh flex-col md:flex-row">
      <!-- Desktop sidebar -->
      <nav
        class="bg-card border-border hidden w-16 shrink-0 flex-col items-center gap-1 border-r pt-4 md:flex"
      >
        {#each navItems as item (item.href)}
          {@const isActive =
            page.url.pathname === item.href ||
            (page.url.pathname.startsWith(item.href) && item.href !== '/')}
          <a
            href={item.href}
            class={`flex flex-col items-center gap-0.5 rounded-lg p-2 text-xs transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <item.icon size={22} />
            <span class="text-[0.6rem] leading-tight">{item.label}</span>
          </a>
        {/each}

        <!-- Timer in sidebar -->
        <div class="mt-auto mb-4 flex flex-col items-center gap-1">
          {#if timerRunning}
            <button
              onclick={() => {
                timerExpanded = !timerExpanded;
              }}
              class="bg-primary/10 text-primary relative flex flex-col items-center gap-0.5 rounded-lg p-2 text-xs"
            >
              <IconClock size={22} class="animate-pulse" />
              <span class="text-[0.6rem] font-mono leading-tight">{timerDisplay()}</span>
            </button>
          {:else}
            <button
              onclick={() => {
                timerExpanded = !timerExpanded;
              }}
              class="text-muted-foreground hover:bg-muted hover:text-foreground flex flex-col items-center gap-0.5 rounded-lg p-2 text-xs transition-colors"
            >
              <IconClock size={22} />
              <span class="text-[0.6rem] leading-tight">Timer</span>
            </button>
          {/if}
        </div>
      </nav>

      <!-- Main content area -->
      <div class="flex min-h-0 flex-1 flex-col">
        <!-- Persistent timer bar (when running, visible on all pages) -->
        {#if timerRunning}
          <div class="bg-primary/5 border-border flex items-center gap-3 border-b px-4 py-2">
            <IconClock size={18} class="text-primary shrink-0 animate-pulse" />
            <div class="flex-1">
              <Progress value={timerProgress()} max={100} class="h-1.5" />
            </div>
            <span class="text-primary font-mono text-sm font-medium">{timerDisplay()}</span>
            <Button variant="ghost" size="icon-xs" onclick={stopTimer}>
              <IconX size={14} />
            </Button>
          </div>
        {/if}

        <!-- Timer quick-start popover (when expanded and not running) -->
        {#if timerExpanded && !timerRunning}
          <div
            class="bg-card border-border absolute right-4 bottom-20 z-50 rounded-xl border p-3 shadow-lg md:bottom-auto md:left-16 md:top-auto md:right-auto"
          >
            <p class="text-muted-foreground mb-2 text-xs font-medium">Rest Timer</p>
            <div class="flex gap-2">
              {#each [60, 90, 120, 180] as seconds (seconds)}
                <Button variant="outline" size="sm" onclick={() => startTimer(seconds)}>
                  {seconds >= 120 ? `${seconds / 60}m` : `${seconds}s`}
                </Button>
              {/each}
            </div>
          </div>
        {/if}

        <main class="flex-1 overflow-y-auto pb-18 md:pb-0">
          {@render children?.()}
        </main>
      </div>

      <!-- Mobile bottom bar -->
      <nav
        class="bg-card border-border fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t py-1 md:hidden"
      >
        {#each navItems as item (item.href)}
          {@const isActive =
            page.url.pathname === item.href ||
            (page.url.pathname.startsWith(item.href) && item.href !== '/')}
          <a
            href={item.href}
            class={`flex flex-col items-center gap-0.5 rounded-lg p-2 text-xs transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <item.icon size={20} />
            <span class="text-[0.6rem] leading-tight">{item.label}</span>
          </a>
        {/each}
        <!-- Timer button in mobile bottom bar -->
        {#if timerRunning}
          <button
            onclick={() => {
              timerExpanded = !timerExpanded;
            }}
            class="text-primary flex flex-col items-center gap-0.5 rounded-lg p-2 text-xs"
          >
            <IconClock size={20} class="animate-pulse" />
            <span class="text-[0.6rem] font-mono leading-tight">{timerDisplay()}</span>
          </button>
        {:else}
          <button
            onclick={() => {
              timerExpanded = !timerExpanded;
            }}
            class="text-muted-foreground flex flex-col items-center gap-0.5 rounded-lg p-2 text-xs transition-colors"
          >
            <IconClock size={20} />
            <span class="text-[0.6rem] leading-tight">Timer</span>
          </button>
        {/if}
      </nav>
    </div>
  {/if}
</div>
