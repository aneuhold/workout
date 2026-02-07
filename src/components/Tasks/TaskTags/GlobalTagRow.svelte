<script lang="ts">
  import type { DashboardTagSetting } from '@aneuhold/core-ts-db-lib';
  import Card, { Content } from '@smui/card';
  import IconButton, { Icon } from '@smui/icon-button';
  import MenuButton, { type MenuButtonItem } from '$components/presentational/MenuButton.svelte';
  import TaskTagsService from '$services/Task/TaskTagsService';
  import { userConfig } from '$stores/local/userConfig/userConfig';

  let {
    tagName,
    maxPriority,
    onOpenEditor
  }: { tagName: string; maxPriority: number; onOpenEditor?: (tagName: string) => void } = $props();

  function getMenuItems(currentTagSettings?: DashboardTagSetting) {
    const menuItems: MenuButtonItem[] = [
      {
        title: 'Edit',
        iconName: 'edit',
        clickAction: () => {
          onOpenEditor?.(tagName);
        }
      },
      {
        title: 'Delete',
        iconName: 'delete',
        clickAction: () => {
          TaskTagsService.deleteTag(tagName);
        }
      }
    ];
    if (currentTagSettings && currentTagSettings.priority !== 0) {
      menuItems.push({
        title: 'Remove priority',
        iconName: 'remove',
        clickAction: removePriorityFromTag
      });
    } else {
      menuItems.push({
        title: 'Add priority',
        iconName: 'add',
        clickAction: addPriorityToTag
      });
    }
    return menuItems;
  }

  function incrementPriority() {
    userConfig.update((settings) => {
      const currentTagSettings = settings.config.tagSettings[tagName];
      if (!currentTagSettings) return settings;
      Object.keys(settings.config.tagSettings).forEach((otherTagName) => {
        // Increment all the existing non-zero tags priority by 1 that are
        // lower than the current tag
        const otherTagSettings = settings.config.tagSettings[otherTagName];
        if (!otherTagSettings) return;
        const otherTagPriority = otherTagSettings.priority;
        if (otherTagPriority === currentTagSettings.priority + 1) {
          otherTagSettings.priority -= 1;
        }
      });
      currentTagSettings.priority += 1;
      return settings;
    });
  }

  function decrementPriority() {
    userConfig.update((settings) => {
      const currentTagSettings = settings.config.tagSettings[tagName];
      if (!currentTagSettings) return settings;
      Object.keys(settings.config.tagSettings).forEach((otherTagName) => {
        // Decrement all the existing non-zero tags priority by 1 that are
        // higher than the current tag
        const otherTagSettings = settings.config.tagSettings[otherTagName];
        if (!otherTagSettings) return;
        const otherTagPriority = otherTagSettings.priority;
        if (otherTagPriority === currentTagSettings.priority - 1) {
          otherTagSettings.priority += 1;
        }
      });
      currentTagSettings.priority -= 1;
      return settings;
    });
  }

  function addPriorityToTag() {
    userConfig.update((settings) => {
      const currentTagSettings = settings.config.tagSettings[tagName];
      if (!currentTagSettings) return settings;
      Object.keys(settings.config.tagSettings).forEach((otherTagName) => {
        // Increment all the existing non-zero tags priority by 1
        const otherTagSettings = settings.config.tagSettings[otherTagName];
        if (otherTagName !== tagName && otherTagSettings && otherTagSettings.priority !== 0) {
          otherTagSettings.priority += 1;
        }
      });
      currentTagSettings.priority = 1;
      return settings;
    });
  }

  function removePriorityFromTag() {
    userConfig.update((settings) => {
      const currentTagSettings = settings.config.tagSettings[tagName];
      if (!currentTagSettings) return settings;
      Object.keys(settings.config.tagSettings).forEach((otherTagName) => {
        // Decrement all the existing non-zero tags priority by 1 that are
        // higher than the current tag
        const otherTagSettings = settings.config.tagSettings[otherTagName];
        if (
          otherTagName !== tagName &&
          otherTagSettings &&
          otherTagSettings.priority !== 0 &&
          otherTagSettings.priority > currentTagSettings.priority
        ) {
          otherTagSettings.priority -= 1;
        }
      });
      currentTagSettings.priority = 0;
      return settings;
    });
  }
  let tagSettings = $derived($userConfig.config.tagSettings[tagName]);
  let menuItems = $derived(tagSettings ? getMenuItems(tagSettings) : []);
</script>

<div>
  {#if tagSettings}
    <Card variant="outlined">
      <Content class="tagRowContent">
        <div class="card-content">
          <div class="left-side">
            {#if tagSettings.priority !== 0}
              <IconButton
                size="button"
                onclick={decrementPriority}
                disabled={tagSettings.priority === 1}
              >
                <Icon class="material-icons">arrow_downward</Icon>
              </IconButton>
              <IconButton
                size="button"
                onclick={incrementPriority}
                disabled={tagSettings.priority === maxPriority}
              >
                <Icon class="material-icons">arrow_upward</Icon>
              </IconButton>
            {/if}
          </div>
          <div class="tagInfo">
            <h4 class="mdc-typography--body1 text">
              {tagName}
            </h4>
            {#if tagSettings.priority !== 0}
              <span class="mdc-deprecated-list-item__secondary-text text">
                Priority: {tagSettings.priority}
              </span>
            {/if}
          </div>
          <MenuButton {menuItems} />
        </div>
      </Content>
    </Card>
  {/if}
</div>

<style>
  * :global(.tagRowContent) {
    padding: 0px;
  }
  .text {
    margin-top: 0px;
    margin-bottom: 0px;
  }
  /* Fixes a weird issue with mdc-deprecated-list-item__secondary-text */
  .text::before {
    display: none;
  }
  .card-content {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 8px;
  }
  .left-side {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
  }
  .tagInfo {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    margin-bottom: 8px;
  }
</style>
