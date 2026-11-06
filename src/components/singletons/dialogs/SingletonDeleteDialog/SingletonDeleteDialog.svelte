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
  import stringFormatService from '$services/StringFormat.service';
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
   * The exercise's calibrations (deleted along with it), and how many
   * exercises, sessions, and mesocycles reference the item.
   */
  let usage = $derived.by(() => {
    if (!currentItem) return null;
    const { id, type } = currentItem;
    switch (type) {
      case WorkoutDocumentType.Exercise: {
        const calibrationIds = exerciseCalibrationMapService.allDocs
          .filter((c) => c.workoutExerciseId === id)
          .map((c) => c._id);
        const sessionCount = new Set(
          sessionExerciseMapService.allDocs
            .filter((se) => se.workoutExerciseId === id)
            .map((se) => se.workoutSessionId)
        ).size;
        const mesocycleCount = mesocycleMapService.allDocs.filter((mesocycle) =>
          mesocycle.calibratedExercises.some((calibrationId) =>
            calibrationIds.includes(calibrationId)
          )
        ).length;
        return { calibrationIds, exerciseCount: 0, sessionCount, mesocycleCount };
      }
      case WorkoutDocumentType.MuscleGroup: {
        const exerciseCount = exerciseMapService.allDocs.filter(
          (exercise) =>
            exercise.primaryMuscleGroups.includes(id) || exercise.secondaryMuscleGroups.includes(id)
        ).length;
        return { calibrationIds: [], exerciseCount, sessionCount: 0, mesocycleCount: 0 };
      }
      case WorkoutDocumentType.Equipment: {
        const exerciseCount = exerciseMapService.allDocs.filter(
          (exercise) => exercise.workoutEquipmentTypeId === id
        ).length;
        return { calibrationIds: [], exerciseCount, sessionCount: 0, mesocycleCount: 0 };
      }
    }
  });

  /**
   * Phrases describing where the item is used, such as "2 sessions". Deletion
   * is blocked when this is non-empty.
   */
  let usageParts = $derived.by(() => {
    if (!usage) return [];
    const parts: string[] = [];
    const { exerciseCount, sessionCount, mesocycleCount } = usage;
    if (exerciseCount > 0) {
      parts.push(stringFormatService.pluralize(exerciseCount, 'exercise'));
    }
    if (sessionCount > 0) {
      parts.push(stringFormatService.pluralize(sessionCount, 'session'));
    }
    if (mesocycleCount > 0) {
      parts.push(stringFormatService.pluralize(mesocycleCount, 'mesocycle'));
    }
    return parts;
  });

  let isBlocked = $derived(usageParts.length > 0);

  function handleConfirm() {
    if (!currentItem || isBlocked) return;
    switch (currentItem.type) {
      case WorkoutDocumentType.Exercise: {
        if (usage && usage.calibrationIds.length > 0) {
          exerciseCalibrationMapService.deleteManyDocs(usage.calibrationIds);
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
        {#if currentItem && isBlocked}
          "{currentItem.name}" is used in {usageParts.join(' and ')}, so it can't be deleted.
          {#if usage && usage.exerciseCount > 0}
            Remove it from those exercises first.
          {/if}
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
