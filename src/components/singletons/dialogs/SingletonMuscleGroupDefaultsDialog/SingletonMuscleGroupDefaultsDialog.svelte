<!--
  @component

  Singleton dialog offering a common starter set of muscle groups for onboarding.
  Import `muscleGroupDefaultsDialog` and call `.open()` from anywhere.
-->
<script lang="ts" module>
  let open = $state(false);

  const DEFAULT_MUSCLE_GROUPS = [
    'Chest',
    'Back',
    'Shoulders',
    'Biceps',
    'Triceps',
    'Quads',
    'Hamstrings',
    'Calves'
  ] as const;

  export const muscleGroupDefaultsDialog = {
    open: () => {
      open = true;
    }
  };
</script>

<script lang="ts">
  import { WorkoutMuscleGroupSchema } from '@aneuhold/core-ts-db-lib';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import { currentUserId } from '$stores/derived/currentUserId';
  import Button from '$ui/Button/Button.svelte';
  import Dialog from '$ui/Dialog/Dialog.svelte';
  import DialogContent from '$ui/Dialog/DialogContent.svelte';
  import DialogFooter from '$ui/Dialog/DialogFooter.svelte';
  import DialogHeader from '$ui/Dialog/DialogHeader.svelte';
  import DialogTitle from '$ui/Dialog/DialogTitle.svelte';
  import { muscleGroupFormDialog } from '../SingletonMuscleGroupFormDialog/SingletonMuscleGroupFormDialog.svelte';

  function handleAddAll() {
    const userId = $currentUserId;
    for (const name of DEFAULT_MUSCLE_GROUPS) {
      const doc = WorkoutMuscleGroupSchema.parse({ userId, name });
      muscleGroupMapService.addDoc(doc);
    }
    open = false;
  }

  function handleAddOwn() {
    open = false;
    muscleGroupFormDialog.openNew();
  }
</script>

<Dialog bind:open>
  <DialogContent trapFocus={false}>
    <DialogHeader>
      <DialogTitle>Add muscle groups</DialogTitle>
    </DialogHeader>
    <p class="text-xs text-muted-foreground">
      Add a common starter set, or add your own one at a time. You can edit or remove any of these
      later.
    </p>
    <div class="grid grid-cols-2 gap-2">
      {#each DEFAULT_MUSCLE_GROUPS as name (name)}
        <div class="rounded-md border px-3 py-2 text-sm">{name}</div>
      {/each}
    </div>
    <DialogFooter>
      <Button variant="outline" type="button" onclick={handleAddOwn}>Add my own</Button>
      <Button type="button" onclick={handleAddAll}>
        Add all {DEFAULT_MUSCLE_GROUPS.length}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
