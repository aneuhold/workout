<!--
  @component
  
  This component is a singleton, and should only ever be used once. Use the
  exported functions to show the dialog.
-->
<script lang="ts" module>
  import Button, { Label } from '@smui/button';
  import Checkbox from '@smui/checkbox';
  import { Actions, Content, Title } from '@smui/dialog';
  import type { UUID } from 'crypto';
  import { writable } from 'svelte/store';
  import InputBox from '$components/presentational/InputBox/InputBox.svelte';
  import SmartDialog from '$components/presentational/SmartDialog.svelte';
  import { nonogramKatanaItemsDisplayInfo } from '$routes/entertainment/nonogramkatana/items/nonogramKatanaItemsDisplayInfo';
  import { nonogramKatanaUpgradesDisplayInfo } from '$routes/entertainment/nonogramkatana/upgrades/nonogramKatanaUpgradesDisplayInfo';
  import nonogramKatanaUpgradeMapService from '$services/NonogramKatana/NonogramKatanaUpgradeMapService';

  /**
   * A Nonogram Katana upgrade dialog which can be used anywhere in the app.
   */
  export const nonogramKatanaUpgradeDialog = {
    open: (upgradeId: UUID) => {
      currentUpgradeId.set(upgradeId);
      open.set(true);
    }
  };

  const currentUpgradeId = writable<UUID | null>(null);
  const open = writable(false);
</script>

<script lang="ts">
  import { NonogramKatanaItemName } from '@aneuhold/core-ts-db-lib';

  let upgrade = $derived(
    $currentUpgradeId ? nonogramKatanaUpgradeMapService.mapState[$currentUpgradeId] : null
  );
  let displayInfo = $derived(
    upgrade ? nonogramKatanaUpgradesDisplayInfo[upgrade.upgradeName] : null
  );

  function getItemAmount(itemName: NonogramKatanaItemName) {
    return upgrade ? (upgrade.currentItemAmounts[itemName] ?? 0) : 0;
  }

  function updateItemToAmount(itemName: NonogramKatanaItemName, amount: number) {
    if (upgrade) {
      nonogramKatanaUpgradeMapService.updateDoc(upgrade._id, (doc) => {
        doc.currentItemAmounts[itemName] = amount;
        return doc;
      });
    }
  }
</script>

<SmartDialog bind:open={$open}>
  {#if upgrade && displayInfo}
    <Title>Update "{displayInfo.displayName}"</Title>
    <Content>
      <div class="content">
        {#if displayInfo.requiredItems.length > 0}
          {#each displayInfo.requiredItems as requiredItem (requiredItem.itemName)}
            <Checkbox
              checked={getItemAmount(requiredItem.itemName) === requiredItem.requiredAmount}
              onclick={() => {
                if (getItemAmount(requiredItem.itemName) !== requiredItem.requiredAmount) {
                  updateItemToAmount(requiredItem.itemName, requiredItem.requiredAmount);
                } else {
                  updateItemToAmount(requiredItem.itemName, 0);
                }
                // might need a state update here.
              }}
            />
            <span class="mdc-typography--body1">
              {nonogramKatanaItemsDisplayInfo[requiredItem.itemName].displayName}
            </span>
            <InputBox
              inputValue={upgrade.currentItemAmounts[requiredItem.itemName]}
              onBlur={(val) => {
                updateItemToAmount(requiredItem.itemName, Number(val));
              }}
              inputType="number"
              min={0}
              max={requiredItem.requiredAmount}
              label="Current"
            />
            <span>Needed: {requiredItem.requiredAmount}</span>
          {/each}
        {/if}
      </div>
      <span>Priority: </span>
      <InputBox
        inputValue={upgrade.priority}
        onBlur={(val) => {
          nonogramKatanaUpgradeMapService.updateDoc(upgrade._id, (doc) => {
            doc.priority = Number(val);
            return doc;
          });
        }}
        inputType="number"
        max={100}
        label="Priority"
      />
    </Content>
    <Actions>
      <Button
        onclick={() => {
          $open = false;
        }}
      >
        <Label>Done</Label>
      </Button>
    </Actions>
  {/if}
</SmartDialog>

<style>
  .content {
    display: grid;
    grid-template-columns: min-content min-content 1fr min-content;
    align-items: center;
    gap: 8px;
  }
</style>
