<!--
  @component

  Singleton confirmation dialog for deleting exercises, muscle groups, or equipment.
  Import `deleteDialog` and call `.open()` from anywhere to trigger.
-->
<script lang="ts" module>
  import type { UUID } from 'crypto';
  import { writable } from 'svelte/store';
  import { WorkoutDocumentType } from '$util/workoutDocumentType';

  type ItemType =
    | typeof WorkoutDocumentType.Exercise
    | typeof WorkoutDocumentType.MuscleGroup
    | typeof WorkoutDocumentType.Equipment;

  const open = writable(false);
  const currentItem = writable<{ name: string; type: ItemType; id: UUID } | null>(null);

  export const deleteDialog = {
    open: (itemName: string, itemType: ItemType, itemId: UUID) => {
      currentItem.set({ name: itemName, type: itemType, id: itemId });
      open.set(true);
    }
  };
</script>

<script lang="ts">
  import equipmentTypeMapService from '$services/documentMapServices/equipmentTypeMapService.svelte';
  import exerciseCalibrationMapService from '$services/documentMapServices/exerciseCalibrationMapService.svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import AlertDialog from '$ui/AlertDialog/AlertDialog.svelte';
  import AlertDialogAction from '$ui/AlertDialog/AlertDialogAction.svelte';
  import AlertDialogCancel from '$ui/AlertDialog/AlertDialogCancel.svelte';
  import AlertDialogContent from '$ui/AlertDialog/AlertDialogContent.svelte';
  import AlertDialogDescription from '$ui/AlertDialog/AlertDialogDescription.svelte';
  import AlertDialogFooter from '$ui/AlertDialog/AlertDialogFooter.svelte';
  import AlertDialogHeader from '$ui/AlertDialog/AlertDialogHeader.svelte';
  import AlertDialogTitle from '$ui/AlertDialog/AlertDialogTitle.svelte';

  let isOpen = $state(false);
  let item = $state<{ name: string; type: ItemType; id: UUID } | null>(null);

  open.subscribe((v) => (isOpen = v));
  currentItem.subscribe((v) => (item = v));

  function syncOpen(v: boolean) {
    open.set(v);
  }

  function typeLabel(type: ItemType): string {
    switch (type) {
      case WorkoutDocumentType.Exercise:
        return 'exercise';
      case WorkoutDocumentType.MuscleGroup:
        return 'muscle group';
      case WorkoutDocumentType.Equipment:
        return 'equipment';
    }
  }

  function handleConfirm() {
    if (!item) return;
    const itemId = item.id;
    switch (item.type) {
      case WorkoutDocumentType.Exercise: {
        const calibrationIds = exerciseCalibrationMapService
          .getDocs()
          .filter((c) => c.workoutExerciseId === itemId)
          .map((c) => c._id);
        if (calibrationIds.length > 0) {
          exerciseCalibrationMapService.deleteManyDocs(calibrationIds);
        }
        exerciseMapService.deleteDoc(item.id);
        break;
      }
      case WorkoutDocumentType.MuscleGroup:
        muscleGroupMapService.deleteDoc(item.id);
        break;
      case WorkoutDocumentType.Equipment:
        equipmentTypeMapService.deleteDoc(item.id);
        break;
    }
    open.set(false);
  }
</script>

<AlertDialog bind:open={isOpen} onOpenChange={syncOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete {item ? typeLabel(item.type) : ''}?</AlertDialogTitle>
      <AlertDialogDescription>
        {#if item}
          Are you sure you want to delete "{item.name}"? This action cannot be undone.
          {#if item.type === WorkoutDocumentType.Exercise}
            Associated calibration data will also be removed.
          {/if}
        {/if}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onclick={handleConfirm}
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
