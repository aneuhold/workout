<!--
  @component
  
  A generic list of links.
-->
<script lang="ts">
  import List from '@smui/list';
  import type { LinkInfo } from './LinkListItem.svelte';
  import LinkListItem from './LinkListItem.svelte';

  let { links }: { links: Array<LinkInfo> } = $props();
</script>

<List twoLine={true}>
  {#each links as linkInfo (linkInfo.title)}
    <LinkListItem {linkInfo} />
  {/each}
</List>
