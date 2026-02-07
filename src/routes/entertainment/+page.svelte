<!--
  @component
  
  A page for entertainment things, like games and stuff like that.
-->
<script lang="ts">
  import Paper, { Content, Title } from '@smui/paper';
  import LinkList from '$components/LinkList.svelte';
  import type { LinkInfo } from '$components/LinkListItem.svelte';
  import PageTitle from '$components/PageTitle.svelte';
  import { nonogramKatanaPageInfo } from './nonogramkatana/pageInfo';
  import { entertainmentPageInfo } from './pageInfo';

  const tableOfContentsLinks: Array<LinkInfo> = [nonogramKatanaPageInfo];
</script>

<svelte:head>
  <title>{entertainmentPageInfo.shortTitle}</title>
  <meta name="description" content={entertainmentPageInfo.description} />
</svelte:head>

<PageTitle title={entertainmentPageInfo.shortTitle} subtitle={entertainmentPageInfo.description} />
<div class="content">
  <Paper>
    <Title>Table of Contents</Title>
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
