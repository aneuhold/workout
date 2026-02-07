<!--
  @component
  
  The root of the application.
-->
<script lang="ts">
  import '../globalStyles/global.css';
  import { onDestroy, onMount, type Snippet } from 'svelte';
  import { browser } from '$app/environment';
  import Confetti from '$components/singletons/Confetti/Confetti.svelte';
  import nonogramKatanaItemMapService from '$services/NonogramKatana/NonogramKatanaItemMapService';
  import nonogramKatanaUpgradeMapService from '$services/NonogramKatana/NonogramKatanaUpgradeMapService';
  import taskMapService from '$services/Task/TaskMapService/TaskMapService';
  import { appIsVisible } from '$stores/session/appIsVisible';
  import { LoginState, loginState } from '$stores/session/loginState';
  import LocalData from '$util/LocalData/LocalData';
  import Login from '../components/Login/Login.svelte';
  import NavBar from '../components/NavBar.svelte';

  let { children }: { children?: Snippet } = $props();

  let mounted = $state(false);

  onMount(() => {
    // Initialize services from LocalData. Not sure if this is the best place, but it does solve
    // the loop issue where services depend upon each other and LocalData needs to be loaded first.
    if (LocalData.nonogramKatanaItemMap) {
      nonogramKatanaItemMapService.setMap(LocalData.nonogramKatanaItemMap);
    }
    if (LocalData.nonogramKatanaUpgradeMap) {
      nonogramKatanaUpgradeMapService.setMap(LocalData.nonogramKatanaUpgradeMap);
    }
    if (LocalData.taskMap) {
      taskMapService.setMap(LocalData.taskMap);
    }
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

<div class="app">
  {#if !mounted || $loginState === LoginState.Initializing}
    <div class="loading">
      <p>Loading...</p>
    </div>
  {:else if $loginState === LoginState.ProcessingCredentials || $loginState === LoginState.LoggedOut}
    <Login />
  {:else}
    <main>
      <Confetti />
      <NavBar>
        <div class="content">
          {@render children?.()}
        </div>
      </NavBar>
    </main>
  {/if}
</div>
