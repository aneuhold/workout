<script lang="ts" module>
  export type MenuButtonItem = {
    title: string;
    iconName: string;
    clickAction: () => void;
  };
</script>

<!--
  @component
  
  A button that opens a menu with a list of items. This cannot be contained
  within an SMUI List, as it will cause the menu to be misaligned.
-->
<script lang="ts">
  import IconButton from '@smui/icon-button';
  import List, { Graphic, Item, Text } from '@smui/list';
  import MenuSurface from '@smui/menu-surface';

  let {
    menuItems,
    alignCenterVertically = false
  }: {
    menuItems: MenuButtonItem[];
    alignCenterVertically?: boolean;
  } = $props();

  function handleItemClick(clickAction: () => void) {
    if (menu) {
      menu.setOpen(false);
      clickAction();
    }
  }

  let menu: MenuSurface | undefined = $state();
</script>

<!--The extra div is required to keep the bounds of the menu contained -->
<div class={alignCenterVertically ? 'alignCenter' : ''}>
  <IconButton
    class="material-icons dimmed-color"
    onclick={() => {
      // The goal would be to set this to the inverse of its current state, but because clicking
      // off of the menu closes it, the inverse of it's current state is always true 😂
      menu?.setOpen(!menu.isOpen());
    }}
  >
    menu
  </IconButton>
  <MenuSurface bind:this={menu} anchorCorner="BOTTOM_RIGHT" data-testid="menu-button-menu">
    <List>
      {#each menuItems as item (item.title)}
        <Item
          onclick={() => {
            handleItemClick(item.clickAction);
          }}
        >
          <Graphic class="material-icons">{item.iconName}</Graphic>
          <Text>{item.title}</Text>
        </Item>
      {/each}
    </List>
  </MenuSurface>
</div>

<style>
  .alignCenter {
    display: flex;
    align-items: center;
  }
</style>
