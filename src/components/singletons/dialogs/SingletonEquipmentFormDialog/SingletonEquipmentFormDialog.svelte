<!--
  @component

  Singleton dialog for adding or editing an equipment type.
  Import `equipmentFormDialog` and call `.openNew()` or `.openEdit()` from anywhere.
-->
<script lang="ts" module>
  import type { WorkoutEquipmentType } from '@aneuhold/core-ts-db-lib';
  import { writable } from 'svelte/store';

  const open = writable(false);
  const currentEquipment = writable<WorkoutEquipmentType | null>(null);

  export const equipmentFormDialog = {
    openNew: () => {
      currentEquipment.set(null);
      open.set(true);
    },
    openEdit: (equipmentType: WorkoutEquipmentType) => {
      currentEquipment.set(equipmentType);
      open.set(true);
    }
  };
</script>

<script lang="ts">
  import {
    WorkoutEquipmentTypeSchema,
    WorkoutEquipmentTypeService
  } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import equipmentTypeMapService from '$services/documentMapServices/equipmentTypeMapService.svelte';
  import { currentUserId } from '$stores/derived/currentUserId';
  import Button from '$ui/Button/Button.svelte';
  import Dialog from '$ui/Dialog/Dialog.svelte';
  import DialogClose from '$ui/Dialog/DialogClose.svelte';
  import DialogContent from '$ui/Dialog/DialogContent.svelte';
  import DialogFooter from '$ui/Dialog/DialogFooter.svelte';
  import DialogHeader from '$ui/Dialog/DialogHeader.svelte';
  import DialogTitle from '$ui/Dialog/DialogTitle.svelte';
  import Input from '$ui/Input/Input.svelte';
  import Label from '$ui/Label/Label.svelte';
  import Switch from '$ui/Switch/Switch.svelte';

  let isOpen = $state(false);
  let editing = $state<WorkoutEquipmentType | null>(null);
  let title = $state('');
  let hasWeightOptions = $state(false);
  let minWeight = $state<number | undefined>(undefined);
  let maxWeight = $state<number | undefined>(undefined);
  let increment = $state<number | undefined>(undefined);

  open.subscribe((v) => (isOpen = v));
  currentEquipment.subscribe((v) => (editing = v));

  function syncOpen(v: boolean) {
    open.set(v);
  }

  $effect(() => {
    const opened = isOpen;
    const current = editing;

    untrack(() => {
      if (opened) {
        title = current?.title ?? '';
        if (current?.weightOptions && current.weightOptions.length > 0) {
          hasWeightOptions = true;
          minWeight = current.weightOptions[0];
          maxWeight = current.weightOptions[current.weightOptions.length - 1];
          if (current.weightOptions.length > 1) {
            increment = current.weightOptions[1] - current.weightOptions[0];
          } else {
            increment = 5;
          }
        } else {
          hasWeightOptions = false;
          minWeight = undefined;
          maxWeight = undefined;
          increment = undefined;
        }
      }
    });
  });

  let weightPreview = $derived.by(() => {
    if (!hasWeightOptions || !minWeight || !increment || !maxWeight) return null;
    if (minWeight <= 0 || increment <= 0 || maxWeight < minWeight) return null;
    const options = WorkoutEquipmentTypeService.generateWeightOptions(
      minWeight,
      increment,
      maxWeight
    );
    if (options.length === 0) return null;
    return `${options[0]}–${options[options.length - 1]} lb (${options.length} options)`;
  });

  let isValid = $derived.by(() => {
    if (title.trim().length === 0) return false;
    if (hasWeightOptions) {
      if (!minWeight || minWeight <= 0) return false;
      if (!increment || increment <= 0) return false;
      if (!maxWeight || maxWeight < minWeight) return false;
    }
    return true;
  });

  let isEditMode = $derived(editing !== null);

  function handleSubmit() {
    if (!isValid) return;
    const userId = $currentUserId;

    const weightOptions =
      hasWeightOptions && minWeight && increment && maxWeight
        ? WorkoutEquipmentTypeService.generateWeightOptions(minWeight, increment, maxWeight)
        : null;

    if (isEditMode && editing) {
      equipmentTypeMapService.updateDoc(editing._id, (doc) => {
        doc.title = title.trim();
        doc.weightOptions = weightOptions;
        doc.lastUpdatedDate = new Date();
        return doc;
      });
    } else {
      const doc = WorkoutEquipmentTypeSchema.parse({
        userId,
        title: title.trim(),
        weightOptions
      });
      equipmentTypeMapService.addDoc(doc);
    }
    open.set(false);
  }
</script>

<Dialog bind:open={isOpen} onOpenChange={syncOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{isEditMode ? 'Edit' : 'Add'} Equipment</DialogTitle>
    </DialogHeader>
    <form
      class="flex flex-col gap-4"
      onsubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div class="flex flex-col gap-1.5">
        <Label for="eq-title">Title</Label>
        <Input id="eq-title" placeholder="e.g. Barbell" bind:value={title} required />
      </div>

      <div class="flex items-center gap-2">
        <Switch bind:checked={hasWeightOptions} />
        <Label>Weight options</Label>
      </div>

      {#if hasWeightOptions}
        <div class="flex flex-col gap-3 rounded-lg bg-muted/50 p-3">
          <div class="grid grid-cols-3 gap-2">
            <div class="flex flex-col gap-1">
              <Label for="eq-min">Min (lb)</Label>
              <Input id="eq-min" type="number" bind:value={minWeight} min="0" step="any" />
            </div>
            <div class="flex flex-col gap-1">
              <Label for="eq-inc">Increment</Label>
              <Input id="eq-inc" type="number" bind:value={increment} min="0" step="any" />
            </div>
            <div class="flex flex-col gap-1">
              <Label for="eq-max">Max (lb)</Label>
              <Input id="eq-max" type="number" bind:value={maxWeight} min="0" step="any" />
            </div>
          </div>
          {#if weightPreview}
            <p class="text-xs text-muted-foreground">{weightPreview}</p>
          {/if}
        </div>
      {/if}

      <DialogFooter>
        <DialogClose>
          <Button variant="outline" type="button">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={!isValid}>
          {isEditMode ? 'Save' : 'Add'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
