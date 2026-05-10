<!--
  @component

  Root layout. Persists across both `(app)` and `(marketing)` route groups,
  so it owns one-time concerns: global CSS, light/dark mode, view
  transitions, app-state hydration, and the document visibility listener.

  Group layouts handle their own UI: `(app)` gates chrome on `loginState`,
  `(marketing)` just renders. Hydration runs even on marketing pages so
  navigating from `/privacy` into the app finds an already-hydrated store.
-->
<script lang="ts">
  import '../globalStyles/global.css';
  import { ModeWatcher } from 'mode-watcher';
  import { onDestroy, onMount, type Snippet } from 'svelte';
  import { browser } from '$app/environment';
  import { onNavigate } from '$app/navigation';
  import nativePlatformService from '$services/NativePlatformService.svelte';
  import timerService from '$services/TimerService';
  import WorkoutAPIService from '$services/WorkoutAPIService';
  import WorkoutHydrationService from '$services/WorkoutHydrationService';
  import { password } from '$stores/local/password';
  import { translations } from '$stores/local/translations';
  import { userConfig } from '$stores/local/userConfig/userConfig';
  import { appIsVisible } from '$stores/session/appIsVisible';
  import { loginState } from '$stores/session/loginState';
  import LocalData from '$util/LocalData/LocalData';

  let { children }: { children?: Snippet } = $props();

  onNavigate((navigation) => {
    const transition = document.startViewTransition?.bind(document);
    if (!transition) return;
    return new Promise((resolve) => {
      transition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  // Still need all the hydration logic at the top to make sure when navigating between marketing
  // pages and app routes, it doesn't break the app. This should be a no-op though and looks like
  // it still loads incredibly fast.
  onMount(async () => {
    await LocalData.init();
    await Promise.all([
      password.hydrate(),
      translations.hydrate(),
      userConfig.hydrate(),
      WorkoutAPIService.hydrate(),
      WorkoutHydrationService.hydrateDocumentMaps()
    ]);
    loginState.init();
    timerService.init();
    nativePlatformService.init();
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
  });
</script>

<ModeWatcher />
{@render children?.()}
