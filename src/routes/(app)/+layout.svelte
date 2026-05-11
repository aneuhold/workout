<!--
  @component

  Layout for the authenticated app. Owns TopBar/NavBar and the
  singleton dialogs, and gates rendering on `loginState`. Hydration and
  app-init run in the root layout, which persists across route groups.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import Login from '$components/Login/Login.svelte';
  import NavBar from '$components/NavBar/NavBar.svelte';
  import SingletonCalibrationFormDialog from '$components/singletons/dialogs/SingletonCalibrationFormDialog/SingletonCalibrationFormDialog.svelte';
  import SingletonDeleteDialog from '$components/singletons/dialogs/SingletonDeleteDialog/SingletonDeleteDialog.svelte';
  import SingletonDeloadDialog from '$components/singletons/dialogs/SingletonDeloadDialog/SingletonDeloadDialog.svelte';
  import SingletonEquipmentFormDialog from '$components/singletons/dialogs/SingletonEquipmentFormDialog/SingletonEquipmentFormDialog.svelte';
  import SingletonMoveSessionsDialog from '$components/singletons/dialogs/SingletonMoveSessionsDialog/SingletonMoveSessionsDialog.svelte';
  import SingletonMuscleGroupDefaultsDialog from '$components/singletons/dialogs/SingletonMuscleGroupDefaultsDialog/SingletonMuscleGroupDefaultsDialog.svelte';
  import SingletonMuscleGroupFormDialog from '$components/singletons/dialogs/SingletonMuscleGroupFormDialog/SingletonMuscleGroupFormDialog.svelte';
  import SingletonRescheduleMesocycleDialog from '$components/singletons/dialogs/SingletonRescheduleMesocycleDialog/SingletonRescheduleMesocycleDialog.svelte';
  import SingletonUpdateNotification from '$components/singletons/dialogs/SingletonUpdateNotification/SingletonUpdateNotification.svelte';
  import TopBar from '$components/TopBar/TopBar.svelte';
  import timerService from '$services/TimerService';
  import { userConfig } from '$stores/local/userConfig/userConfig';
  import { LoginState, loginState } from '$stores/session/loginState';

  let { children }: { children?: Snippet } = $props();
</script>

<div class="app">
  {#if $loginState === LoginState.Initializing}
    <div class="flex h-dvh items-center justify-center">
      <p class="animate-pulse text-muted-foreground">Loading...</p>
    </div>
  {:else if $loginState === LoginState.ProcessingCredentials || $loginState === LoginState.LoggedOut}
    <Login />
  {:else}
    <TopBar username={$userConfig.username} currentPath={page.url.pathname} />
    <NavBar currentPath={page.url.pathname} />
    <!-- Padding top is set to 12 for all devices only if the timer is active (because it becomes fixed).
     Otherwise, it is only fixed for desktop. -->
    <main
      class="[view-transition-name:main-content] md:pt-(--top-nav-height) pb-(--bottom-nav-height) md:pb-0 md:pl-48
        {timerService.isActive && page.url.pathname !== '/timer' ? 'pt-(--top-nav-height)' : ''}"
    >
      {@render children?.()}
    </main>
    <SingletonCalibrationFormDialog />
    <SingletonDeleteDialog />
    <SingletonDeloadDialog />
    <SingletonEquipmentFormDialog />
    <SingletonMoveSessionsDialog />
    <SingletonMuscleGroupDefaultsDialog />
    <SingletonMuscleGroupFormDialog />
    <SingletonRescheduleMesocycleDialog />
    <SingletonUpdateNotification />
  {/if}
</div>
