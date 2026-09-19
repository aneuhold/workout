<script lang="ts">
  import type { WorkoutEquipmentType } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import equipmentTypeMapServiceMock from '$services/documentMapServices/EquipmentTypeMap.service.mock';
  import Button from '$ui/Button/Button.svelte';
  import SingletonEquipmentFormDialog from './SingletonEquipmentFormDialog.svelte';
  import { equipmentFormDialog } from './SingletonEquipmentFormDialog.svelte';

  let equipment = $state<WorkoutEquipmentType[]>([]);

  $effect(() => {
    untrack(() => {
      equipmentTypeMapServiceMock.reset();
      equipment = equipmentTypeMapServiceMock.addDefaultEquipmentTypes();
    });

    return () => {
      untrack(() => {
        equipmentTypeMapServiceMock.reset();
      });
    };
  });
</script>

<div class="flex flex-col gap-3 p-4">
  <h3 class="text-sm font-medium">Equipment Form Dialog</h3>
  <div class="flex flex-wrap gap-2">
    <Button onclick={() => equipmentFormDialog.openNew()}>Add New</Button>
    {#if equipment[0]}
      <Button variant="outline" onclick={() => equipmentFormDialog.openEdit(equipment[0])}>
        Edit "{equipment[0].title}"
      </Button>
    {/if}
  </div>
</div>
<SingletonEquipmentFormDialog />
