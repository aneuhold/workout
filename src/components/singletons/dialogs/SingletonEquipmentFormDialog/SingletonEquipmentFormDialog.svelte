<!--
  @component

  Singleton dialog for adding or editing an equipment type.
  Import `equipmentFormDialog` and call `.openNew()` or `.openEdit()` from anywhere.
-->
<script lang="ts" module>
  import type { WorkoutEquipmentType } from '@aneuhold/core-ts-db-lib';

  let open = $state(false);
  let currentEquipment = $state<WorkoutEquipmentType | null>(null);

  export const equipmentFormDialog = {
    openNew: () => {
      currentEquipment = null;
      open = true;
    },
    openEdit: (equipmentType: WorkoutEquipmentType) => {
      currentEquipment = equipmentType;
      open = true;
    }
  };
</script>

<script lang="ts">
  import { WorkoutEquipmentTypeSchema } from '@aneuhold/core-ts-db-lib';
  import { IconPlus, IconX } from '@tabler/icons-svelte';
  import { untrack } from 'svelte';
  import equipmentTypeMapService from '$services/documentMapServices/equipmentTypeMapService.svelte';
  import { currentUserId } from '$stores/derived/currentUserId';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button, { buttonVariants } from '$ui/Button/Button.svelte';
  import Dialog from '$ui/Dialog/Dialog.svelte';
  import DialogClose from '$ui/Dialog/DialogClose.svelte';
  import DialogContent from '$ui/Dialog/DialogContent.svelte';
  import DialogFooter from '$ui/Dialog/DialogFooter.svelte';
  import DialogHeader from '$ui/Dialog/DialogHeader.svelte';
  import DialogTitle from '$ui/Dialog/DialogTitle.svelte';
  import Input from '$ui/Input/Input.svelte';
  import Label from '$ui/Label/Label.svelte';
  import Textarea from '$ui/Textarea/Textarea.svelte';
  import EquipmentFormDialogWeightGenerator from './EquipmentFormDialogWeightGenerator.svelte';

  let title = $state('');
  let description = $state('');

  // Single source of truth for weight options
  let weightOptions = $state<number[]>([]);
  let newWeight = $state('');
  let showGenerator = $state(false);

  // Open/reset effect
  $effect(() => {
    const opened = open;
    const current = currentEquipment;

    untrack(() => {
      if (opened) {
        title = current?.title ?? '';
        description = current?.description ?? '';
        newWeight = '';

        if (current?.weightOptions && current.weightOptions.length > 0) {
          weightOptions = [...current.weightOptions];
          showGenerator = false;
        } else {
          weightOptions = [];
          showGenerator = true;
        }
      }
    });
  });

  let isValid = $derived(title.trim().length > 0 && weightOptions.length > 0);

  let isEditMode = $derived(currentEquipment !== null);

  function removeWeight(weight: number) {
    weightOptions = weightOptions.filter((v) => v !== weight);
  }

  function addWeight() {
    const parsed = parseFloat(newWeight);
    if (isNaN(parsed) || parsed < 0) return;
    if (weightOptions.includes(parsed)) {
      newWeight = '';
      return;
    }
    weightOptions = [...weightOptions, parsed].sort((a, b) => a - b);
    newWeight = '';
  }

  function handleSubmit() {
    if (!isValid) return;
    const userId = $currentUserId;

    const finalWeights = weightOptions.length > 0 ? [...weightOptions] : null;

    if (isEditMode && currentEquipment) {
      equipmentTypeMapService.updateDoc(currentEquipment._id, (doc) => {
        doc.title = title.trim();
        doc.description = description.trim() || null;
        doc.weightOptions = finalWeights;
        doc.lastUpdatedDate = new Date();
        return doc;
      });
    } else {
      const doc = WorkoutEquipmentTypeSchema.parse({
        userId,
        title: title.trim(),
        description: description.trim() || null,
        weightOptions: finalWeights
      });
      equipmentTypeMapService.addDoc(doc);
    }
    open = false;
  }
</script>

<Dialog bind:open>
  <DialogContent trapFocus={false}>
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

      <div class="flex flex-col gap-1.5">
        <Label for="eq-description">Description</Label>
        <Textarea
          id="eq-description"
          placeholder="Optional description..."
          bind:value={description}
        />
      </div>

      <div class="flex flex-col gap-3 rounded-lg bg-muted/50 p-3">
        <Label>Weight Options</Label>

        <div class="flex items-end gap-2">
          <Input
            id="eq-add-weight"
            type="number"
            placeholder="Add weight (lb)"
            class="flex-1"
            bind:value={newWeight}
            min="0"
            step="any"
            onkeydown={(e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addWeight();
              }
            }}
          />
          <Button
            variant="outline"
            size="icon"
            type="button"
            class="size-9 shrink-0"
            onclick={addWeight}
          >
            <IconPlus class="size-4" />
          </Button>
        </div>

        {#if !showGenerator}
          <Button
            variant="outline"
            size="sm"
            type="button"
            class="w-fit"
            onclick={() => (showGenerator = true)}
          >
            Regenerate weights
          </Button>
        {/if}

        {#if showGenerator}
          <EquipmentFormDialogWeightGenerator
            onGenerate={(weights) => (weightOptions = weights)}
            onDone={() => (showGenerator = false)}
          />
        {/if}

        <p class="text-xs text-muted-foreground">
          {weightOptions.length} weight option{weightOptions.length !== 1 ? 's' : ''}
        </p>
        {#if weightOptions.length > 0}
          <div class="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
            {#each weightOptions as weight (weight)}
              <Badge variant="secondary" class="gap-0.5 pr-1">
                {weight}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  class="ml-0.5 size-4 rounded-full"
                  onclick={() => removeWeight(weight)}
                >
                  <IconX class="size-3" />
                </Button>
              </Badge>
            {/each}
          </div>
        {/if}
      </div>

      <DialogFooter>
        <DialogClose class={buttonVariants({ variant: 'outline' })} type="button">
          Cancel
        </DialogClose>
        <Button type="submit" disabled={!isValid}>
          {isEditMode ? 'Save' : 'Add'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
