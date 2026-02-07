<script lang="ts">
  import IconButton, { Icon } from '@smui/icon-button';
  import TopAppBar, { AutoAdjust, Row, Section, Title } from '@smui/top-app-bar';
  import type { Snippet } from 'svelte';
  import { goto } from '$app/navigation';
  import GitHubIcon from '$lib/svgs/GitHubIcon.svelte';
  import { apiKey } from '$stores/local/apiKey';
  import { LoginState, loginState } from '$stores/session/loginState';
  import { navDrawerOpen } from '$stores/session/navDrawerOpen';
  import NavDrawer from './NavDrawer.svelte';

  let {
    children
  }: {
    children?: Snippet;
  } = $props();

  let topAppBar: TopAppBar | null = $state(null);

  function handleLogOut() {
    apiKey.set(null);
    loginState.set(LoginState.LoggedOut);
  }
</script>

<TopAppBar bind:this={topAppBar} variant="fixed" prominent={false} dense={true} color="primary">
  <Row>
    <Section>
      <IconButton
        class="material-icons"
        onclick={() => {
          $navDrawerOpen = true;
        }}>menu</IconButton
      >
      <div class="dashboard-title">
        <Title
          onclick={() => {
            goto('/');
          }}
        >
          Personal Dashboard
        </Title>
      </div>
    </Section>
    <Section align="end" toolbar>
      <IconButton
        class="material-icons"
        aria-label="GitHub"
        onclick={() => {
          window.open('https://github.com/aneuhold?tab=repositories', '_blank');
        }}
      >
        <Icon><GitHubIcon size={24} /></Icon>
      </IconButton>
      <IconButton class="material-icons" aria-label="Log Out" onclick={handleLogOut}>
        logout
      </IconButton>
    </Section>
  </Row>
</TopAppBar>

<AutoAdjust {topAppBar}>
  <NavDrawer />
  {@render children?.()}
</AutoAdjust>

<style>
  .dashboard-title {
    cursor: pointer;
  }
</style>
