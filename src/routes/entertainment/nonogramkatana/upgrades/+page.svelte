<script lang="ts">
  import { type NonogramKatanaUpgrade, NonogramKatanaUpgradeName } from '@aneuhold/core-ts-db-lib';
  import Button from '@smui/button';
  import Checkbox from '@smui/checkbox';
  import Paper, { Content } from '@smui/paper';
  import { flip } from 'svelte/animate';
  import PageTitle from '$components/PageTitle.svelte';
  import InputBox from '$components/presentational/InputBox/InputBox.svelte';
  import SingletonNonogramKatanaUpgradeDialog from '$components/singletons/dialogs/SingletonNonogramKatanaUpgradeDialog.svelte';
  import nonogramKatanaUpgradeMapService from '$services/NonogramKatana/NonogramKatanaUpgradeMapService';
  import { userConfig } from '$stores/local/userConfig/userConfig';
  import NonogramKatanaUpgradeRow from './NonogramKatanaUpgradeRow.svelte';
  import { nonogramKatanaUpgradesPageInfo } from './pageInfo';

  const sortFunction: (
    a: NonogramKatanaUpgrade | undefined,
    b: NonogramKatanaUpgrade | undefined
  ) => number = (a, b) => {
    if (!a) {
      return 1;
    } else if (!b) {
      return -1;
    }
    return b.priority - a.priority;
  };

  let showAll = $state(false);
  let searchInput = $state('');
  let allUpgrades = $derived(
    Object.values(nonogramKatanaUpgradeMapService.mapState)
      .filter((upgrade) => upgrade !== undefined)
      .sort(sortFunction)
  );
  let workableUpgrades = $derived(
    Object.values(
      nonogramKatanaUpgradeMapService.getWorkableUpgrades(nonogramKatanaUpgradeMapService.mapState)
    ).sort(sortFunction)
  );
  let currentlyShownUpgrades = $derived(
    (showAll ? allUpgrades : workableUpgrades).filter((upgrade) =>
      upgrade.upgradeName.toLowerCase().includes(searchInput.toLowerCase().trim())
    )
  );
  let upgradesMissing = $derived(
    Object.values(nonogramKatanaUpgradeMapService.mapState).length <
      Object.values(NonogramKatanaUpgradeName).length
  );
</script>

<svelte:head>
  <title>{nonogramKatanaUpgradesPageInfo.shortTitle}</title>
  <meta name="description" content={nonogramKatanaUpgradesPageInfo.description} />
</svelte:head>

<PageTitle
  title={nonogramKatanaUpgradesPageInfo.shortTitle}
  subtitle={nonogramKatanaUpgradesPageInfo.description}
/>
<div class="content">
  <Paper>
    <Content>
      <div class="topSettingsRow">
        {#if upgradesMissing}
          <Button
            onclick={() => {
              nonogramKatanaUpgradeMapService.createOrUpdateUpgrades($userConfig.config.userId);
            }}
          >
            Add / Update Upgrades
          </Button>
        {/if}
        <div class="showAllSetting">
          Show all upgrades
          <Checkbox bind:checked={showAll} touch />
        </div>
      </div>
      <div class="searchBox">
        <InputBox label="Search" bind:inputValue={searchInput} />
      </div>
      {#if currentlyShownUpgrades.length > 0}
        {#each currentlyShownUpgrades as upgrade (upgrade.upgradeName)}
          <div animate:flip={{ duration: 200 }}>
            <NonogramKatanaUpgradeRow upgradeName={upgrade.upgradeName} />
          </div>
        {/each}
      {/if}
    </Content>
  </Paper>
</div>
<SingletonNonogramKatanaUpgradeDialog />

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .topSettingsRow {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    justify-content: space-between;
  }
  .showAllSetting {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .searchBox {
    margin: 0px 16px 16px 16px;
    display: flex;
    flex-direction: column;
  }
</style>
