<!--
  @component

  Singleton dialog for adding or editing a muscle group.
  Import `muscleGroupFormDialog` and call `.openNew()` or `.openEdit()` from anywhere.
-->
<script lang="ts" module>
  import type { WorkoutMuscleGroup } from '@aneuhold/core-ts-db-lib';

  let open = $state(false);
  let currentMuscleGroup = $state<WorkoutMuscleGroup | null>(null);

  export const muscleGroupFormDialog = {
    openNew: () => {
      currentMuscleGroup = null;
      open = true;
    },
    openEdit: (muscleGroup: WorkoutMuscleGroup) => {
      currentMuscleGroup = muscleGroup;
      open = true;
    }
  };
</script>

<script lang="ts">
  import { WorkoutMuscleGroupSchema } from '@aneuhold/core-ts-db-lib';
  import { untrack } from 'svelte';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import { currentUserId } from '$stores/derived/currentUserId';
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

  let name = $state('');
  let description = $state('');

  $effect(() => {
    const opened = open;
    const current = currentMuscleGroup;

    untrack(() => {
      if (opened) {
        name = current?.name ?? '';
        description = current?.description ?? '';
      }
    });
  });

  let isValid = $derived(name.trim().length > 0);
  let isEditMode = $derived(currentMuscleGroup !== null);

  function handleSubmit() {
    if (!isValid) return;
    const userId = $currentUserId;

    if (isEditMode && currentMuscleGroup) {
      muscleGroupMapService.updateDoc(currentMuscleGroup._id, (doc) => {
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
    open = false;
  }
</script>

<Dialog bind:open>
  <DialogContent trapFocus={false}>
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
