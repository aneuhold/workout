<!--
  @component

  A navigation drawer that slides in from the left side of the screen.

  Documentation on SMUI's NavDrawer and possible options can be found [here](https://sveltematerialui.com/demo/drawer/).
-->
<script lang="ts">
  import Drawer, { Content } from '@smui/drawer';
  import List, { Graphic, Item, Separator, Text } from '@smui/list';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { settingsPageInfo } from '$routes/settings/pageInfo';
  import { enabledPages } from '$stores/session/enabledPages';
  import { navDrawerOpen } from '$stores/session/navDrawerOpen';
  import type { PageInfo } from '$util/navInfo';
  import { clickOutside } from '../actions/clickOutside';

  let { activeRoute = $bindable('/') }: { activeRoute?: string } = $props();

  $effect(() => {
    if (page.route.id) {
      activeRoute = page.route.id;
    }
  });

  function setRoute(newRoute: string) {
    $navDrawerOpen = false;
    goto(newRoute);
  }

  function getNestingText(pageInfo: PageInfo) {
    let nestingText = '';
    for (let i = 0; i < pageInfo.nestingLevel; i++) {
      nestingText += '-';
    }
    return nestingText;
  }
</script>

<div
  use:clickOutside={() => {
    $navDrawerOpen = false;
  }}
>
  <Drawer variant="modal" bind:open={$navDrawerOpen}>
    <Content>
      <List>
        {#each $enabledPages as pageInfo (pageInfo.url)}
          {#if pageInfo.title === settingsPageInfo.title}
            <Separator />
          {/if}
          <Item
            onclick={() => {
              setRoute(pageInfo.url);
            }}
            activated={activeRoute === pageInfo.url}
          >
            {#if pageInfo.nestingLevel > 0}
              <span class="nesting-text">{getNestingText(pageInfo)}</span>
            {/if}
            {#if pageInfo.iconName}
              <Graphic class="material-icons" aria-hidden="true">
                {pageInfo.iconName}
              </Graphic>
            {/if}
            {#if pageInfo.icon}
              <Graphic><pageInfo.icon /></Graphic>
            {/if}
            <Text>{pageInfo.shortTitle}</Text>
          </Item>
        {/each}
      </List>
    </Content>
  </Drawer>
</div>

<style>
  .nesting-text {
    margin-right: 4px;
  }
</style>
