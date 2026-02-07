<script lang="ts">
  import Paper, { Content, Title } from '@smui/paper';
  import CatImage from '$components/CatImage.svelte';
  import LinkList from '$components/LinkList.svelte';
  import type { LinkInfo } from '$components/LinkListItem.svelte';
  import PageTitle from '$components/PageTitle.svelte';
  import { userConfig } from '$stores/local/userConfig/userConfig';
  import { enabledPages } from '$stores/session/enabledPages';
  import type { PageInfo } from '$util/navInfo';
  import { homePageInfo } from './pageInfo';

  let tableOfContentsLinks = $derived(
    $enabledPages.filter((pageInfo: PageInfo) => {
      return pageInfo.nestingLevel === 0 && pageInfo.title !== homePageInfo.title;
    })
  );

  const primaryLinks: Array<LinkInfo> = [
    {
      title: 'House Wiki (TiddlyWiki)',
      description: 'Wiki for house info',
      clickAction: () => {
        window.open(
          'https://tiddlydrive.github.io/?state=%7B%22ids%22:%5B%221ujSre3E0f8HxLW4pqSTh5bFeztEB5zTx%22%5D,%22action%22:%22open%22,%22userId%22:%22112679225576170416987%22%7D#Carpets:Carpets%20Refrigerators%20Appliances%20%5B%5BWater%20Heaters%5D%5D%20%5B%5BHVAC%20Furnace%5D%5D%20%5B%5BHeat%20Exchangers%5D%5D%20%5B%5BHeating%20Ventilation%20and%20Cooling%20(HVAC)%5D%5D%20%5B%5BPlumbing%20Pipes%5D%5D%20%5B%5BPlumbing%20Vent%5D%5D%20%5B%5BPlumbing%20Trap%5D%5D%20Plumbing',
          '_blank'
        );
      },
      iconName: 'home'
    },
    {
      title: 'Fun things to do together (Trello)',
      description: 'Trello board for fun things to do together',
      clickAction: () => {
        window.open('https://trello.com/b/XQLfAUM0/trex-polar-bar-board', '_blank');
      },
      iconName: 'favorite'
    },
    {
      title: 'House Projects (Trello)',
      description: 'Trello board for house projects',
      clickAction: () => {
        window.open('https://trello.com/b/alkxSGrm/house-projects', '_blank');
      },
      iconName: 'home'
    },
    {
      title: 'House Inventory (Zenkit)',
      description: 'Inventory of items in the house',
      clickAction: () => {
        window.open(
          'https://base.zenkit.com/c/BJCrPZaNQ/ashley-tony-inventory?v=H1QsyOWpVm',
          '_blank'
        );
      },
      iconName: 'home'
    }
  ];
</script>

<svelte:head>
  <title>{homePageInfo.title}</title>
  <meta name="description" content={homePageInfo.description} />
</svelte:head>

<PageTitle title={homePageInfo.title} />

<div class="content">
  <Paper>
    <Title>Table of Contents</Title>
    <Content>
      <LinkList links={tableOfContentsLinks} />
    </Content>
  </Paper>
  {#if $userConfig.config.enabledFeatures.catImageOnHomePage}
    <Paper>
      <Content>
        <CatImage />
      </Content>
    </Paper>
  {/if}
  {#if $userConfig.config.enabledFeatures.homePageLinks}
    <Paper>
      <Title>Primary Links</Title>
      <Content>
        <LinkList links={primaryLinks} />
      </Content>
    </Paper>
  {/if}
</div>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
