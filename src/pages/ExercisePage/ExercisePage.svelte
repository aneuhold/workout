<!--
  @component

  Full-page exercise detail, edit, and creation view.
  Supports view mode (read-only), edit mode, and new exercise creation.
-->
<script lang="ts">
  import { IconArrowLeft } from '@tabler/icons-svelte';
  import { goto } from '$app/navigation';
  import SingletonCalibrationFormDialog from '$components/singletons/dialogs/SingletonCalibrationFormDialog/SingletonCalibrationFormDialog.svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import Button from '$ui/Button/Button.svelte';
  import ExercisePageEditForm from './ExercisePageEditForm.svelte';
  import ExercisePageViewMode from './ExercisePageViewMode.svelte';

  let {
    exerciseId,
    isNew
  }: {
    exerciseId: string | null;
    isNew: boolean;
  } = $props();

  // --- Data ---

  let exercise = $derived(
    exerciseId ? exerciseMapService.getDocs().find((e) => e._id === exerciseId) : undefined
  );

  // --- Mode ---

  let editOverride = $state<boolean | null>(null);
  let editMode = $derived(editOverride !== null ? editOverride : isNew);

  function handleCancel() {
    if (isNew) {
      goto('/library');
    } else {
      editOverride = false;
    }
  }
</script>

<div class="flex flex-col gap-4 p-4">
  <!-- Header -->
  <div class="flex items-center gap-2">
    <Button variant="ghost" size="sm" onclick={() => goto('/library')}>
      <IconArrowLeft size={16} />
    </Button>
    {#if editMode}
      <h1 class="text-xl font-semibold">{isNew ? 'New Exercise' : 'Edit Exercise'}</h1>
    {:else if exercise}
      <h1 class="text-xl font-semibold">{exercise.exerciseName}</h1>
    {/if}
  </div>

  {#if editMode}
    <ExercisePageEditForm {exercise} {isNew} onCancel={handleCancel} />
  {:else if exercise}
    <ExercisePageViewMode {exercise} onEdit={() => (editOverride = true)} />
  {:else}
    <p class="text-sm text-muted-foreground">Exercise not found.</p>
    <Button variant="outline" onclick={() => goto('/library')}>Back to Library</Button>
  {/if}
</div>

<SingletonCalibrationFormDialog />
