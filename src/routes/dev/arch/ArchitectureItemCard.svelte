<!--
  @component

  An Architecture card that is made to look like a list item. The contents
  will be put into the description if contents are provided.

  Implementation notes:

  It had to be made to be a card instead of a list item because of clashing
  in styles when using the menu component.
-->
<script lang="ts">
  import Card, { Content as CardContent } from '@smui/card';
  import { Icon } from '@smui/icon-button';
  import Tooltip, { Wrapper } from '@smui/tooltip';
  import type { Snippet } from 'svelte';
  import MenuButton, { type MenuButtonItem } from '$components/presentational/MenuButton.svelte';
  import type { ArchitectureComponent } from '$util/ArchitectureInfo/architectureComponents';
  import ArchitectureInfo from '$util/ArchitectureInfo/ArchitectureInfo';

  let {
    archComponent,
    children
  }: {
    archComponent: ArchitectureComponent;
    children?: Snippet;
  } = $props();

  function openUrl(url: string | undefined) {
    if (url) window.open(url, '_blank');
  }
  let title = $derived(archComponent.title);
  let categories = $derived(archComponent.categories);
  let archComponentType = $derived(archComponent.type);
  let iconComponent = $derived(archComponent.icon);
  let dependencyNames = $derived(archComponent.dependencies?.map((component) => component.title));

  let menuItems = $derived<MenuButtonItem[]>(
    (() => {
      const items: MenuButtonItem[] = [];
      if (archComponent.configurationUrl) {
        items.push({
          title: 'Configure',
          iconName: 'build',
          clickAction: () => {
            openUrl(archComponent.configurationUrl);
          }
        });
      }
      if (archComponent.docsUrl) {
        items.push({
          title: 'Docs',
          iconName: 'article',
          clickAction: () => {
            openUrl(archComponent.docsUrl);
          }
        });
      }
      if (archComponent.latestExampleProjectUrl) {
        items.push({
          title: 'Latest Example Project or Code',
          iconName: 'code',
          clickAction: () => {
            openUrl(archComponent.latestExampleProjectUrl);
          }
        });
      }
      return items;
    })()
  );
</script>

<div class="container">
  <Card variant="outlined">
    <CardContent>
      <div class="card-content">
        <div class="left-side">
          {#if iconComponent}
            {@const SvelteComponent = iconComponent}
            <Icon class="material-icons"><SvelteComponent size={30} /></Icon>
          {/if}
          <div>
            <h4 class="mdc-typography--body1 title">
              {title}
              <Wrapper>
                <Icon class="material-icons dimmed-color small-icon">
                  {ArchitectureInfo.getComponentTypeIconName(archComponentType)}
                </Icon>
                <Tooltip>{ArchitectureInfo.getComponentTypeTooltip(archComponentType)}</Tooltip>
              </Wrapper>
            </h4>
            {#if categories.length > 0}
              <div class="mdc-typography--caption mdc-theme--text-hint-on-background">
                {#each categories as category, index (category.title)}
                  <span><i>{category.title}</i></span>
                  {#if index !== categories.length - 1}
                    <span>, </span>
                  {/if}
                {/each}
              </div>
            {/if}
            {#if children}
              <div class="mdc-deprecated-list-item__secondary-text subtitle no-before">
                {@render children()}
              </div>
            {/if}
            {#if dependencyNames}
              <div class="mdc-typography--caption mdc-theme--text-hint-on-background dependencies">
                <span>Dependencies: </span>
                <ul class="dependencies-list">
                  {#each dependencyNames as dependencyName (dependencyName)}
                    <li>{dependencyName}</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        </div>
        {#if menuItems.length > 0}
          <MenuButton {menuItems} />
        {/if}
      </div>
    </CardContent>
  </Card>
</div>

<style>
  .container {
    padding: 2px;
  }
  .title {
    margin-top: 0px;
    margin-bottom: -5px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
  }
  .subtitle {
    margin-top: 4px;
    margin-bottom: 0px;
    text-wrap: wrap;
  }
  .card-content {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
  .left-side {
    display: flex;
    flex-direction: row;
    gap: 16px;
    align-items: center;
  }
  .dependencies {
    margin-top: 4px;
  }
  .dependencies-list {
    margin-top: 0px;
    margin-bottom: 0px;
    padding-inline-start: 20px;
  }
</style>
