<!--
  @component
  
  The root of the application.
-->
<script lang="ts">
  import '../globalStyles/global.css';
  import { ModeWatcher } from 'mode-watcher';
  import { onDestroy, onMount, type Snippet } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import Login from '$components/Login/Login.svelte';
  import NavBar from '$components/NavBar/NavBar.svelte';
  import { appIsVisible } from '$stores/session/appIsVisible';
  import { LoginState, loginState } from '$stores/session/loginState';

  let { children }: { children?: Snippet } = $props();

  let mounted = $state(false);

  onMount(() => {
    // Initialize services from LocalData. Not sure if this is the best place, but it does solve
    // the loop issue where services depend upon each other and LocalData needs to be loaded first.
    // TODO: Initialize workout services from LocalData when needed
    // Without this, the layout fluctuates a lot when the page is starting up.
    mounted = true;
  });

  const handleVisibilityChange = () => {
    appIsVisible.set(document.visibilityState === 'visible');
  };

  // Global app visibility change listener
  if (browser) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  });
</script>

<!-- 
Light / Dark mode watcher. This comes with a component toggle as well if you want to use that
at some point.
-->
<ModeWatcher />
<div class="app">
  {#if !mounted || $loginState === LoginState.Initializing}
    <div class="loading">
      <p>Loading...</p>
    </div>
  {:else if $loginState === LoginState.ProcessingCredentials || $loginState === LoginState.LoggedOut}
    <Login />
  {:else}
    <NavBar currentPath={$page.url.pathname} />
    <main class="pb-16 md:pb-0 md:pl-48">{@render children?.()}</main>
  {/if}
</div>
