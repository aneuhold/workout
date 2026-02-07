<script lang="ts">
  import {
    DashboardTaskSortBy,
    DashboardTaskSortDirection,
    type DashboardTaskSortSetting
  } from '@aneuhold/core-ts-db-lib';
  import Card, { Content } from '@smui/card';
  import Checkbox from '@smui/checkbox';
  import { preventDefault } from '@smui/common/events';
  import IconButton, { Icon } from '@smui/icon-button';
  import SegmentedButton, { Segment } from '@smui/segmented-button';

  let {
    sortSetting,
    disabled,
    onEnable,
    onDisable,
    onIncrementPriority,
    onDecrementPriority,
    onDirectionChange
  }: {
    sortSetting: DashboardTaskSortSetting;
    disabled: boolean;
    onEnable?: (sortBy: DashboardTaskSortBy) => void;
    onDisable?: (sortBy: DashboardTaskSortBy) => void;
    onIncrementPriority?: (sortBy: DashboardTaskSortBy) => void;
    onDecrementPriority?: (sortBy: DashboardTaskSortBy) => void;
    onDirectionChange?: (
      sortBy: DashboardTaskSortBy,
      direction: DashboardTaskSortDirection
    ) => void;
  } = $props();

  type SortDirectionChoice = {
    value: DashboardTaskSortDirection;
    iconName: string;
  };

  const sortDirectionChoices: SortDirectionChoice[] = [
    {
      value: DashboardTaskSortDirection.descending,
      iconName: 'arrow_downward'
    },
    {
      value: DashboardTaskSortDirection.ascending,
      iconName: 'arrow_upward'
    }
  ];

  function enable() {
    onEnable?.(sortSetting.sortBy);
  }
  function disable() {
    onDisable?.(sortSetting.sortBy);
  }
  function incrementPriority() {
    onIncrementPriority?.(sortSetting.sortBy);
  }
  function decrementPriority() {
    onDecrementPriority?.(sortSetting.sortBy);
  }
  function getSortName(sortBy: DashboardTaskSortBy) {
    switch (sortBy) {
      case DashboardTaskSortBy.tags:
        return 'Tags';
      case DashboardTaskSortBy.title:
        return 'Title';
      case DashboardTaskSortBy.dueDate:
        return 'Due Date';
      case DashboardTaskSortBy.startDate:
        return 'Start Date';
      case DashboardTaskSortBy.createdDate:
        return 'Created Date';
      case DashboardTaskSortBy.lastUpdatedDate:
        return 'Last Updated Date';
      default:
        return 'Unknown';
    }
  }
  let sortName = $derived(getSortName(sortSetting.sortBy));
  let tagContentClass = $derived(
    disabled ? 'card-content dimmed-color' : 'card-content colorWhite'
  );
  let sortDirectionChoice = $derived(
    sortDirectionChoices.find((choice) => choice.value === sortSetting.sortDirection)
  );
</script>

<div>
  <Card variant="outlined">
    <Content class="tagRowContent">
      <div class={tagContentClass}>
        <div class="iconSet leftIconSet">
          <Checkbox
            checked={!disabled}
            touch
            class="tagCheckbox"
            onclick={() => {
              if (disabled) {
                enable();
              } else {
                disable();
              }
            }}
          />
          {#if !disabled}
            <IconButton size="button" onclick={decrementPriority}>
              <Icon class="material-icons">arrow_downward</Icon>
            </IconButton>
            <IconButton size="button" onclick={incrementPriority}>
              <Icon class="material-icons">arrow_upward</Icon>
            </IconButton>
          {/if}
        </div>
        <h4 class="mdc-typography--body1 text">
          {sortName}
        </h4>
        {#if !disabled}
          <div class="iconSet">
            <SegmentedButton
              segments={sortDirectionChoices}
              singleSelect
              selected={sortDirectionChoice}
              key={(segment) => segment.value.toString()}
              class="tagSegmentedButton"
            >
              {#snippet segment(choice: SortDirectionChoice)}
                <Segment
                  segment={choice}
                  title={choice.value.toString()}
                  onclick={preventDefault(() => {
                    onDirectionChange?.(sortSetting.sortBy, choice.value);
                  })}
                >
                  <Icon class="material-icons">{choice.iconName}</Icon>
                </Segment>
              {/snippet}
            </SegmentedButton>
          </div>
        {/if}
      </div>
    </Content>
  </Card>
</div>

<style>
  * :global(.tagRowContent) {
    padding: 0px;
  }
  * :global(.tagCheckbox) {
    margin: 0px;
  }
  * :global(.tagSegmentedButton) {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
  }
  .colorWhite {
    color: var(--mdc-theme-on-primary);
  }
  .text {
    margin-top: 4px;
    margin-bottom: 4px;
  }
  .card-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-right: 8px;
  }
  .iconSet {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
  }
  .leftIconSet {
    margin-right: -4px;
  }
</style>
