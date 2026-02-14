<!--
  @component

  Singleton dialog for adding or editing a muscle group.
  Import `muscleGroupFormDialog` and call `.openNew()` or `.openEdit()` from anywhere.
-->
<script lang="ts" module>
  import type { WorkoutMuscleGroup } from '@aneuhold/core-ts-db-lib';
  import { writable } from 'svelte/store';

  const open = writable(false);
  const currentMuscleGroup = writable<WorkoutMuscleGroup | null>(null);

  export const muscleGroupFormDialog = {
    openNew: () => {
      currentMuscleGroup.set(null);
      open.set(true);
    },
    openEdit: (muscleGroup: WorkoutMuscleGroup) => {
      currentMuscleGroup.set(muscleGroup);
      open.set(true);
    }
  };
</script>

<script lang="ts">
  import { WorkoutMuscleGroupSchema } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
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
  import Textarea from '$ui/Textarea/Textarea.svelte';

  let isOpen = $state(false);
  let editing = $state<WorkoutMuscleGroup | null>(null);
  let name = $state('');
  let description = $state('');

  open.subscribe((v) => (isOpen = v));
  currentMuscleGroup.subscribe((v) => (editing = v));

  function syncOpen(v: boolean) {
    open.set(v);
  }

  $effect(() => {
    const opened = isOpen;
    const current = editing;

    untrack(() => {
      if (opened) {
        name = current?.name ?? '';
        description = current?.description ?? '';
      }
    });
  });

  let isValid = $derived(name.trim().length > 0);
  let isEditMode = $derived(editing !== null);

  function handleSubmit() {
    if (!isValid) return;
    const userId = $currentUserId;

    if (isEditMode && editing) {
      muscleGroupMapService.updateDoc(editing._id, (doc) => {
        doc.name = name.trim();
        doc.description = description.trim() || null;
        doc.lastUpdatedDate = new Date();
        return doc;
      });
    } else {
      const doc = WorkoutMuscleGroupSchema.parse({
        userId,
        name: name.trim(),
        description: description.trim() || null
      });
      muscleGroupMapService.addDoc(doc);
    }
    open.set(false);
  }
</script>

<Dialog bind:open={isOpen} onOpenChange={syncOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{isEditMode ? 'Edit' : 'Add'} Muscle Group</DialogTitle>
    </DialogHeader>
    <form
      class="flex flex-col gap-4"
      onsubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div class="flex flex-col gap-1.5">
        <Label for="mg-name">Name</Label>
        <Input id="mg-name" placeholder="e.g. Chest" bind:value={name} required />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label for="mg-description">Description (optional)</Label>
        <Textarea
          id="mg-description"
          placeholder="Optional description..."
          bind:value={description}
        />
      </div>
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
