<!--
  @component

  Singleton confirmation dialog for deleting exercises, muscle groups, or equipment.
  Import `deleteDialog` and call `.open()` from anywhere to trigger.
-->
<script lang="ts" module>
  import type { UUID } from 'crypto';
  import { WorkoutDocumentType } from '$util/WorkoutDocumentType';

  type ItemType =
    WorkoutDocumentType.Exercise | WorkoutDocumentType.MuscleGroup | WorkoutDocumentType.Equipment;

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
  import equipmentTypeMapService from '$services/documentMapServices/EquipmentTypeMap.service.svelte';
  import exerciseCalibrationMapService from '$services/documentMapServices/ExerciseCalibrationMap.service.svelte';
  import exerciseMapService from '$services/documentMapServices/ExerciseMap.service.svelte';
  import mesocycleMapService from '$services/documentMapServices/MesocycleMap.service.svelte';
  import muscleGroupMapService from '$services/documentMapServices/MuscleGroupMap.service.svelte';
  import sessionExerciseMapService from '$services/documentMapServices/SessionExerciseMap.service.svelte';
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

  /**
   * The exercise's calibrations, and how many sessions and mesocycles reference it.
   * Null when the item isn't an exercise.
   */
  let exerciseUsage = $derived.by(() => {
    if (currentItem?.type !== WorkoutDocumentType.Exercise) return null;
    const exerciseId = currentItem.id;
    const calibrationIds = exerciseCalibrationMapService.allDocs
      .filter((c) => c.workoutExerciseId === exerciseId)
      .map((c) => c._id);
    const sessionCount = new Set(
      sessionExerciseMapService.allDocs
        .filter((se) => se.workoutExerciseId === exerciseId)
        .map((se) => se.workoutSessionId)
    ).size;
    const mesocycleCount = mesocycleMapService.allDocs.filter((mesocycle) =>
      mesocycle.calibratedExercises.some((id) => calibrationIds.includes(id))
    ).length;
    return { calibrationIds, sessionCount, mesocycleCount };
  });

  /**
   * If the deletion is blocked.
   */
  let isBlocked = $derived(
    exerciseUsage != null && (exerciseUsage.sessionCount > 0 || exerciseUsage.mesocycleCount > 0)
  );

  function handleConfirm() {
    if (!currentItem || isBlocked) return;
    switch (currentItem.type) {
      case WorkoutDocumentType.Exercise: {
        if (exerciseUsage && exerciseUsage.calibrationIds.length > 0) {
          exerciseCalibrationMapService.deleteManyDocs(exerciseUsage.calibrationIds);
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
      <AlertDialogTitle>
        {isBlocked ? "Can't delete" : 'Delete'}
        {currentItem ? typeLabel(currentItem.type) : ''}{isBlocked ? '' : '?'}
      </AlertDialogTitle>
      <AlertDialogDescription>
        {#if currentItem && exerciseUsage && isBlocked}
          "{currentItem.name}" is used in
          {#if exerciseUsage.sessionCount > 0}
            {exerciseUsage.sessionCount}
            {exerciseUsage.sessionCount === 1 ? 'session' : 'sessions'}
          {/if}
          {#if exerciseUsage.sessionCount > 0 && exerciseUsage.mesocycleCount > 0}
            and
          {/if}
          {#if exerciseUsage.mesocycleCount > 0}
            {exerciseUsage.mesocycleCount}
            {exerciseUsage.mesocycleCount === 1 ? 'mesocycle' : 'mesocycles'}
          {/if}, so it can't be deleted.
        {:else if currentItem}
          Are you sure you want to delete "{currentItem.name}"? This action cannot be undone.
          {#if currentItem.type === WorkoutDocumentType.Exercise}
            Associated calibration data will also be removed.
          {/if}
        {/if}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{isBlocked ? 'Close' : 'Cancel'}</AlertDialogCancel>
      {#if !isBlocked}
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onclick={handleConfirm}
        >
          Delete
        </AlertDialogAction>
      {/if}
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
