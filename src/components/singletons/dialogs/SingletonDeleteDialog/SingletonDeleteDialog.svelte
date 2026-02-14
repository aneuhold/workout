<!--
  @component

  Singleton confirmation dialog for deleting exercises, muscle groups, or equipment.
  Import `deleteDialog` and call `.open()` from anywhere to trigger.
-->
<script lang="ts" module>
  import type { UUID } from 'crypto';
  import { WorkoutDocumentType } from '$util/WorkoutDocumentType';

  type ItemType =
    | WorkoutDocumentType.Exercise
    | WorkoutDocumentType.MuscleGroup
    | WorkoutDocumentType.Equipment;

  let open = $state(false);
  let currentItem = $state<{ name: string; type: ItemType; id: UUID } | null>(null);

  export const deleteDialog = {
    open: (itemName: string, itemType: ItemType, itemId: UUID) => {
      currentItem = { name: itemName, type: itemType, id: itemId };
      open = true;
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
    if (!currentItem) return;
    const itemId = currentItem.id;
    switch (currentItem.type) {
      case WorkoutDocumentType.Exercise: {
        const calibrationIds = exerciseCalibrationMapService
          .getDocs()
          .filter((c) => c.workoutExerciseId === itemId)
          .map((c) => c._id);
        if (calibrationIds.length > 0) {
          exerciseCalibrationMapService.deleteManyDocs(calibrationIds);
        }
        exerciseMapService.deleteDoc(currentItem.id);
        break;
      }
      case WorkoutDocumentType.MuscleGroup:
        muscleGroupMapService.deleteDoc(currentItem.id);
        break;
      case WorkoutDocumentType.Equipment:
        equipmentTypeMapService.deleteDoc(currentItem.id);
        break;
    }
    open = false;
  }
</script>

<AlertDialog bind:open>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete {currentItem ? typeLabel(currentItem.type) : ''}?</AlertDialogTitle>
      <AlertDialogDescription>
        {#if currentItem}
          Are you sure you want to delete "{currentItem.name}"? This action cannot be undone.
          {#if currentItem.type === WorkoutDocumentType.Exercise}
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
