<!--
  @component
  
  This component is a singleton, and should only ever be used once. Use the
  exported functions to show the dialog.
-->
<script lang="ts" module>
  import Button, { Label } from '@smui/button';
  import { Actions, Content, Title } from '@smui/dialog';
  import type { UUID } from 'crypto';
  import { writable } from 'svelte/store';
  import SmartDialog from '$components/presentational/SmartDialog.svelte';
  import nonogramKatanaItemMapService from '$services/NonogramKatana/NonogramKatanaItemMapService';

  /**
   * A Nonogram Katana item dialog which can be used anywhere in the app.
   */
  export const nonogramKatanaItemDialog = {
    open: (itemId: UUID) => {
      currentItemId.set(itemId);
      open.set(true);
    }
  };

  const currentItemId = writable<UUID | null>(null);
  const open = writable(false);
</script>

<script lang="ts">
  import Checkbox from '@smui/checkbox';
  import InputBox from '$components/presentational/InputBox/InputBox.svelte';
  import { nonogramKatanaItemsDisplayInfo } from '$routes/entertainment/nonogramkatana/items/nonogramKatanaItemsDisplayInfo';

  let item = $derived(
    $currentItemId ? nonogramKatanaItemMapService.mapState[$currentItemId] : null
  );
  let displayInfo = $derived(item ? nonogramKatanaItemsDisplayInfo[item.itemName] : null);
  let minDesiredPresent = $derived(
    item && item.minDesired !== undefined && item.minDesired !== null
  );
  let maxDesiredPresent = $derived(
    item && item.maxDesired !== undefined && item.maxDesired !== null
  );
  let storageCapPresent = $derived(
    item && item.storageCap !== undefined && item.storageCap !== null
  );
</script>

<SmartDialog bind:open={$open}>
  {#if item && displayInfo}
    <Title>Update "{displayInfo.displayName}"</Title>
    <Content>
      <div class="content">
        <Checkbox
          checked={minDesiredPresent}
          onclick={() => {
            nonogramKatanaItemMapService.updateDoc(item._id, (doc) => {
              if (minDesiredPresent) {
                doc.minDesired = null;
              } else {
                doc.minDesired = 0;
              }
              return doc;
            });
          }}
        />
        {#if minDesiredPresent}
          <InputBox
            inputValue={item.minDesired}
            onBlur={(val) => {
              nonogramKatanaItemMapService.updateDoc(item._id, (doc) => {
                doc.minDesired = Number(val);
                return doc;
              });
            }}
            inputType="number"
            min={0}
            max={item.storageCap}
            label="Min Desired"
          />
        {:else}
          <i class="mdc-typography--body1 dimmed-color">Min desired</i>
        {/if}
        <Checkbox
          checked={maxDesiredPresent}
          onclick={() => {
            nonogramKatanaItemMapService.updateDoc(item._id, (doc) => {
              if (maxDesiredPresent) {
                doc.maxDesired = null;
              } else {
                doc.maxDesired = doc.storageCap ?? 400;
              }
              return doc;
            });
          }}
        />
        {#if maxDesiredPresent}
          <InputBox
            inputValue={item.maxDesired}
            onBlur={(val) => {
              nonogramKatanaItemMapService.updateDoc(item._id, (doc) => {
                doc.maxDesired = Number(val);
                return doc;
              });
            }}
            inputType="number"
            min={item.minDesired ?? 0}
            max={item.storageCap}
            label="Max Desired"
          />
        {:else}
          <i class="mdc-typography--body1 dimmed-color">Max desired</i>
        {/if}
        <Checkbox
          checked={storageCapPresent}
          onclick={() => {
            nonogramKatanaItemMapService.updateDoc(item._id, (doc) => {
              if (storageCapPresent) {
                doc.storageCap = null;
              } else {
                doc.storageCap = doc.maxDesired ?? 400;
              }
              return doc;
            });
          }}
        />
        {#if storageCapPresent}
          <InputBox
            inputValue={item.storageCap}
            onBlur={(val) => {
              nonogramKatanaItemMapService.updateDoc(item._id, (doc) => {
                doc.storageCap = Number(val);
                return doc;
              });
            }}
            inputType="number"
            min={1}
            label="Storage Cap"
          />
        {:else}
          <i class="mdc-typography--body1 dimmed-color">Storage cap</i>
        {/if}
      </div>
      <span>Priority: </span>
      <InputBox
        inputValue={item.priority}
        onBlur={(val) => {
          nonogramKatanaItemMapService.updateDoc(item._id, (doc) => {
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
    grid-template-columns: min-content 1fr;
    align-items: center;
  }
</style>
