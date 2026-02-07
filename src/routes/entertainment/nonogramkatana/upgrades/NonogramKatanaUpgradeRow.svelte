<script lang="ts">
  import type { NonogramKatanaUpgradeName } from '@aneuhold/core-ts-db-lib';
  import Card, { Content as CardContent } from '@smui/card';
  import Checkbox from '@smui/checkbox';
  import { Icon } from '@smui/common';
  import IconButton from '@smui/icon-button';
  import { nonogramKatanaUpgradeDialog } from '$components/singletons/dialogs/SingletonNonogramKatanaUpgradeDialog.svelte';
  import nonogramKatanaUpgradeMapService from '$services/NonogramKatana/NonogramKatanaUpgradeMapService';
  import NonogramKatanaRequiredItem from './NonogramKatanaRequiredItem.svelte';
  import NonogramKatanaRequiredUpgrade from './NonogramKatanaRequiredUpgrade.svelte';
  import { nonogramKatanaUpgradesDisplayInfo } from './nonogramKatanaUpgradesDisplayInfo';

  let { upgradeName }: { upgradeName: NonogramKatanaUpgradeName } = $props();
  let upgrade = $derived(nonogramKatanaUpgradeMapService.getUpgradeByName(upgradeName));
  let displayInfo = $derived(nonogramKatanaUpgradesDisplayInfo[upgradeName]);
</script>

<div class="container">
  <Card variant="outlined">
    <CardContent>
      <div class="card-content">
        <div class="left-side">
          <Checkbox
            checked={upgrade?.completed ?? false}
            onclick={() => {
              if (upgrade) {
                nonogramKatanaUpgradeMapService.updateDoc(upgrade._id, (doc) => {
                  doc.completed = !doc.completed;
                  return doc;
                });
              }
            }}
            touch
          />
          {#if displayInfo.icon}
            <Icon class="material-icons">
              <displayInfo.icon size={30} />
            </Icon>
          {/if}
          <div>
            <h4 class="mdc-typography--body1 title">
              {displayInfo.displayName}
            </h4>
            <div class="mdc-typography--caption mdc-theme--text-hint-on-background dependencies">
              <span>Required items: </span>
              <ul class="dependencies-list">
                {#each displayInfo.requiredItems as requiredItem (requiredItem.itemName)}
                  <NonogramKatanaRequiredItem
                    requiredAmount={requiredItem.requiredAmount}
                    currentAmount={upgrade?.currentItemAmounts[requiredItem.itemName] ?? 0}
                    itemName={requiredItem.itemName}
                  />
                {/each}
              </ul>
            </div>
            {#if displayInfo.requiredUpgrades.length > 0}
              <div class="mdc-typography--caption mdc-theme--text-hint-on-background dependencies">
                <span>Required upgrades: </span>
                <ul class="dependencies-list">
                  {#each displayInfo.requiredUpgrades as requiredUpgrade (requiredUpgrade)}
                    <NonogramKatanaRequiredUpgrade upgradeName={requiredUpgrade} />
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        </div>
        <IconButton
          onclick={() => {
            if (upgrade) nonogramKatanaUpgradeDialog.open(upgrade._id);
          }}
        >
          <Icon class="material-icons dimmed-color">edit</Icon>
        </IconButton>
      </div>
    </CardContent>
  </Card>
</div>

<style>
  .container {
    padding: 2px;
  }
  .title {
    margin-top: 0px;
    margin-bottom: 0px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
  .card-content {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
  .left-side {
    display: flex;
    flex-direction: row;
    gap: 16px;
    align-items: center;
  }
  .dependencies {
    margin-top: 4px;
  }
  .dependencies-list {
    margin-top: 0px;
    margin-bottom: 0px;
    padding-inline-start: 20px;
  }
</style>
