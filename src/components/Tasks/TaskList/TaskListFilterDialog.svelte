<script lang="ts">
  import type { DashboardTaskListFilterSettings } from '@aneuhold/core-ts-db-lib';
  import Button, { Label } from '@smui/button';
  import { Actions, Content, Title } from '@smui/dialog';
  import SmartDialog from '$components/presentational/SmartDialog.svelte';
  import TaskTagsService from '$services/Task/TaskTagsService';
  import TaskFilterSetting from './TaskFilterSetting.svelte';

  let {
    open = $bindable(),
    initialSettings,
    onUpdateSettings,
    onReset
  }: {
    open: boolean;
    initialSettings: DashboardTaskListFilterSettings;
    onUpdateSettings?: (settings: DashboardTaskListFilterSettings) => void;
    onReset?: () => void;
  } = $props();

  const userTags = TaskTagsService.getStore();

  // svelte-ignore state_referenced_locally
  let currentSettings = $state(
    JSON.parse(JSON.stringify(initialSettings)) as DashboardTaskListFilterSettings
  );
  let previousOpen = $state(false);
  $effect(() => {
    if (open !== previousOpen) {
      currentSettings = JSON.parse(
        JSON.stringify(initialSettings)
      ) as DashboardTaskListFilterSettings;
    }
    previousOpen = open;
  });

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
</script>

<SmartDialog bind:open>
  <Title>Task Filtering Options</Title>
  <Content>
    <TaskFilterSetting
      settingName="Show Completed"
      enabled={currentSettings.completed.show}
      onclick={() => {
        currentSettings.completed.show = !currentSettings.completed.show;
      }}
    />
    <TaskFilterSetting
      settingName="Show Future Tasks"
      enabled={currentSettings.startDate.showFutureTasks}
      onclick={() => {
        currentSettings.startDate.showFutureTasks = !currentSettings.startDate.showFutureTasks;
      }}
    />
    <TaskFilterSetting
      settingName="Show All Children Tasks"
      enabled={currentSettings.grandChildrenTasks.show}
      onclick={() => {
        currentSettings.grandChildrenTasks.show = !currentSettings.grandChildrenTasks.show;
      }}
    />
    <span class="tagsSeparator">Show Tags</span>
    {#each $userTags as tag (tag)}
      <TaskFilterSetting
        settingName={tag}
        enabled={currentSettings.tags[tag] ? currentSettings.tags[tag].show : true}
        onclick={() => {
          if (currentSettings.tags[tag]) {
            currentSettings.tags[tag].show = !currentSettings.tags[tag].show;
          } else {
            currentSettings.tags[tag] = {
              show: false
            };
          }
        }}
      />
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
  .tagsSeparator {
    display: flex;
    flex-direction: row;
    justify-content: center;
    margin: 8px;
  }
</style>
