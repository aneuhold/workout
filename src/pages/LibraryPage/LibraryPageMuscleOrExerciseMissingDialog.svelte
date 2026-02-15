<script lang="ts">
  import { equipmentFormDialog } from '$components/singletons/dialogs/SingletonEquipmentFormDialog/SingletonEquipmentFormDialog.svelte';
  import { muscleGroupFormDialog } from '$components/singletons/dialogs/SingletonMuscleGroupFormDialog/SingletonMuscleGroupFormDialog.svelte';
  import AlertDialog from '$ui/AlertDialog/AlertDialog.svelte';
  import AlertDialogAction from '$ui/AlertDialog/AlertDialogAction.svelte';
  import AlertDialogCancel from '$ui/AlertDialog/AlertDialogCancel.svelte';
  import AlertDialogContent from '$ui/AlertDialog/AlertDialogContent.svelte';
  import AlertDialogDescription from '$ui/AlertDialog/AlertDialogDescription.svelte';
  import AlertDialogFooter from '$ui/AlertDialog/AlertDialogFooter.svelte';
  import AlertDialogHeader from '$ui/AlertDialog/AlertDialogHeader.svelte';
  import AlertDialogTitle from '$ui/AlertDialog/AlertDialogTitle.svelte';

  let {
    open = $bindable(false),
    missingEquipment,
    missingMuscleGroups
  }: {
    open: boolean;
    missingEquipment: boolean;
    missingMuscleGroups: boolean;
  } = $props();
</script>

<AlertDialog bind:open>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        {#if missingEquipment && missingMuscleGroups}
          Before adding an exercise
        {:else if missingEquipment}
          Equipment required
        {:else}
          Muscle group required
        {/if}
      </AlertDialogTitle>
      <AlertDialogDescription>
        {#if missingEquipment && missingMuscleGroups}
          Exercises require at least one equipment type and one muscle group. Add these first to get
          started.
        {:else if missingEquipment}
          Exercises require at least one equipment type. Add one first.
        {:else}
          Exercises require at least one muscle group. Add one first.
        {/if}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      {#if missingMuscleGroups}
        <AlertDialogAction
          onclick={() => {
            muscleGroupFormDialog.openNew();
            open = false;
          }}
        >
          Add Muscle Group
        </AlertDialogAction>
      {/if}
      {#if missingEquipment}
        <AlertDialogAction
          onclick={() => {
            equipmentFormDialog.openNew();
            open = false;
          }}
        >
          Add Equipment
        </AlertDialogAction>
      {/if}
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
