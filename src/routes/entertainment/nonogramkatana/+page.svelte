<!--
  @component
  
  A page for entertainment things, like games and stuff like that.
-->
<script lang="ts">
  import Paper, { Content } from '@smui/paper';
  import LinkList from '$components/LinkList.svelte';
  import type { LinkInfo } from '$components/LinkListItem.svelte';
  import PageTitle from '$components/PageTitle.svelte';
  import { nonogramKatanaItemsPageInfo } from './items/pageInfo';
  import { nonogramKatanaPageInfo } from './pageInfo';
  import { nonogramKatanaUpgradesPageInfo } from './upgrades/pageInfo';

  const tableOfContentsLinks: Array<LinkInfo> = [
    nonogramKatanaItemsPageInfo,
    nonogramKatanaUpgradesPageInfo
  ];

  // What should be the data structure for the info here?
</script>

<svelte:head>
  <title>{nonogramKatanaPageInfo.shortTitle}</title>
  <meta name="description" content={nonogramKatanaPageInfo.description} />
</svelte:head>

<PageTitle
  title={nonogramKatanaPageInfo.shortTitle}
  subtitle={nonogramKatanaPageInfo.description}
/>
<div class="content">
  <Paper>
    <Content>
      <LinkList links={tableOfContentsLinks} />
    </Content>
  </Paper>
</div>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
