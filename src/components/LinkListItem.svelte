<!--
  @component
  
  A list item that contains a link to some site or another page. This depends
  on there being a parent List component with `twoLines` set to true.
-->
<script lang="ts" module>
  import { Icon } from '@smui/icon-button';
  import { Graphic, Item, PrimaryText, SecondaryText, Text } from '@smui/list';
  import type { Component } from 'svelte';

  export interface LinkInfo {
    title: string;
    description?: string;
    iconName?: string;
    icon?: Component;
    clickAction: () => void;

    isInternalLink?: boolean;
  }
</script>

<script lang="ts">
  let { linkInfo }: { linkInfo: LinkInfo } = $props();
</script>

<Item onclick={linkInfo.clickAction}>
  {#if linkInfo.iconName}
    <Graphic><Icon class="material-icons">{linkInfo.iconName}</Icon></Graphic>
  {/if}
  {#if linkInfo.icon}
    <Graphic><linkInfo.icon /></Graphic>
  {/if}
  <Text>
    <PrimaryText>
      {linkInfo.title}
      {#if !linkInfo.isInternalLink}
        <Icon class="material-icons dimmed-color x-small-icon">open_in_new</Icon>
      {/if}
    </PrimaryText>
    <SecondaryText>{linkInfo.description ? linkInfo.description : '...'}</SecondaryText>
  </Text>
</Item>
