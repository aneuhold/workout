<script lang="ts">
  import {
    type DashboardTaskListSortSettings,
    DashboardTaskSortBy,
    DashboardTaskSortDirection
  } from '@aneuhold/core-ts-db-lib';
  import Button, { Label } from '@smui/button';
  import { Actions, Content, Title } from '@smui/dialog';
  import { flip } from 'svelte/animate';
  import { SvelteSet } from 'svelte/reactivity';
  import { slide } from 'svelte/transition';
  import SmartDialog from '$components/presentational/SmartDialog.svelte';
  import TaskSortSetting from './TaskSortSetting.svelte';

  let {
    open = $bindable(),
    initialSettings,
    onUpdateSettings,
    onReset
  }: {
    open: boolean;
    initialSettings: DashboardTaskListSortSettings;
    onUpdateSettings?: (settings: DashboardTaskListSortSettings) => void;
    onReset?: () => void;
  } = $props();

  let previousOpen = $state(false);

  /**
   * Initialize with the initial settings, but it will be reset with each open.
   */
  // svelte-ignore state_referenced_locally
  let currentSettings: DashboardTaskListSortSettings = $state(initialSettings);
  let currentSortList = $derived(currentSettings.sortList);
  let disabledSortSettings = $derived(getDisabledSortSettings(currentSettings));

  function handleDone() {
    onUpdateSettings?.(currentSettings);
    open = false;
  }
  function handleCancel() {
    open = false;
  }
  function handleReset() {
    onReset?.();
    open = false;
  }

  function getDisabledSortSettings(settings: DashboardTaskListSortSettings): DashboardTaskSortBy[] {
    const disabledSettings = new SvelteSet(Object.keys(DashboardTaskSortBy));
    settings.sortList.forEach((sortSetting) => {
      disabledSettings.delete(sortSetting.sortBy);
    });
    return Array.from(disabledSettings) as DashboardTaskSortBy[];
  }

  function handleEnable(sortBy: DashboardTaskSortBy) {
    currentSettings.sortList.push({
      sortBy,
      sortDirection: DashboardTaskSortDirection.descending
    });
    currentSortList = currentSettings.sortList;
    disabledSortSettings = getDisabledSortSettings(currentSettings);
  }
  function handleDisable(sortBy: DashboardTaskSortBy) {
    currentSettings.sortList = currentSettings.sortList.filter(
      (sortSetting) => sortSetting.sortBy !== sortBy
    );
    currentSortList = currentSettings.sortList;
    disabledSortSettings = getDisabledSortSettings(currentSettings);
  }

  /**
   * Moves the sort setting up in priority.
   *
   * This is opposite of what you would expect, because the sort settings are
   * ordered in descending priority.
   *
   * @param sortBy The sort by to increment priority for.
   */
  function handleIncrement(sortBy: DashboardTaskSortBy) {
    const sortList = currentSettings.sortList;
    const settingIndex = sortList.findIndex((sortSetting) => sortSetting.sortBy === sortBy);
    if (settingIndex === -1 || settingIndex === 0) return;
    // Swap elements
    moveSortSetting(settingIndex, settingIndex - 1);
  }
  function handleDecrement(sortBy: DashboardTaskSortBy) {
    const sortList = currentSettings.sortList;
    const settingIndex = sortList.findIndex((sortSetting) => sortSetting.sortBy === sortBy);
    if (settingIndex === -1 || settingIndex === sortList.length - 1) return;
    // Swap elements
    moveSortSetting(settingIndex, settingIndex + 1);
  }

  function moveSortSetting(fromIndex: number, toIndex: number) {
    const sortList = currentSettings.sortList;
    const temp = sortList[fromIndex];
    sortList[fromIndex] = sortList[toIndex];
    sortList[toIndex] = temp;
    currentSettings.sortList = sortList;
    currentSortList = sortList;
  }

  function handleDirectionChange(
    sortBy: DashboardTaskSortBy,
    direction: DashboardTaskSortDirection
  ) {
    const sortSetting = currentSettings.sortList.find((s) => s.sortBy === sortBy);
    if (sortSetting) {
      sortSetting.sortDirection = direction;
    }
  }

  $effect(() => {
    if (open !== previousOpen) {
      currentSettings = JSON.parse(
        JSON.stringify(initialSettings)
      ) as DashboardTaskListSortSettings;
      currentSortList = currentSettings.sortList;
      disabledSortSettings = getDisabledSortSettings(currentSettings);
    }
    previousOpen = open;
  });
</script>

<SmartDialog bind:open>
  <Title>Task Sorting Options</Title>
  <Content>
    {#each currentSortList as sortSetting (sortSetting.sortBy)}
      <div animate:flip={{ duration: 250 }} transition:slide>
        <TaskSortSetting
          {sortSetting}
          disabled={false}
          onDisable={handleDisable}
          onIncrementPriority={handleIncrement}
          onDecrementPriority={handleDecrement}
          onDirectionChange={handleDirectionChange}
        />
      </div>
    {/each}
    {#each disabledSortSettings as disabledSetting (disabledSetting)}
      <div transition:slide>
        <TaskSortSetting
          sortSetting={{
            sortBy: disabledSetting,
            sortDirection: DashboardTaskSortDirection.descending
          }}
          onEnable={handleEnable}
          disabled={true}
        />
      </div>
    {/each}
  </Content>
  <Actions>
    <Button color="secondary" onclick={handleReset}>
      <Label>Reset</Label>
    </Button>
    <Button onclick={handleCancel}>
      <Label>Cancel</Label>
    </Button>
    <Button onclick={handleDone}>
      <Label>Done</Label>
    </Button>
  </Actions>
</SmartDialog>

<style>
</style>
