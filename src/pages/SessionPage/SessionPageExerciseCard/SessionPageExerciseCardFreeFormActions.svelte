<!--
  @component

  Free-form exercise action buttons: Done, Edit, and Remove Exercise with confirmation dialog.
  Only visible in Active/Planning mode for free-form sessions.
-->
<script lang="ts">
  import type { WorkoutExercise } from '@aneuhold/core-ts-db-lib';
  import { IconTrash } from '@tabler/icons-svelte';
  import AlertDialog from '$ui/AlertDialog/AlertDialog.svelte';
  import AlertDialogAction from '$ui/AlertDialog/AlertDialogAction.svelte';
  import AlertDialogCancel from '$ui/AlertDialog/AlertDialogCancel.svelte';
  import AlertDialogContent from '$ui/AlertDialog/AlertDialogContent.svelte';
  import AlertDialogDescription from '$ui/AlertDialog/AlertDialogDescription.svelte';
  import AlertDialogFooter from '$ui/AlertDialog/AlertDialogFooter.svelte';
  import AlertDialogHeader from '$ui/AlertDialog/AlertDialogHeader.svelte';
  import AlertDialogTitle from '$ui/AlertDialog/AlertDialogTitle.svelte';
  import Button from '$ui/Button/Button.svelte';
  import { SessionPageMode } from '../sessionPageTypes';

  let {
    exercise,
    exerciseDone,
    allExerciseSetsLogged,
    mode,
    freeFormEditable,
    onDone,
    onEdit,
    onRemoveExercise
  }: {
    exercise: WorkoutExercise | undefined;
    exerciseDone: boolean;
    allExerciseSetsLogged: boolean;
    mode: SessionPageMode;
    freeFormEditable: boolean;
    onDone?: () => void;
    onEdit?: () => void;
    onRemoveExercise?: () => void;
  } = $props();

  let confirmRemoveOpen = $state(false);
</script>

<div class="flex flex-col gap-2">
  {#if mode === SessionPageMode.Active}
    {#if exerciseDone}
      <Button variant="outline" class="w-full" onclick={() => onEdit?.()}>Edit</Button>
    {:else}
      <Button class="w-full" disabled={!allExerciseSetsLogged} onclick={() => onDone?.()}>
        Done
      </Button>
    {/if}
  {/if}
  {#if freeFormEditable}
    <Button
      variant="ghost"
      size="sm"
      class="self-start text-destructive hover:text-destructive"
      onclick={() => (confirmRemoveOpen = true)}
    >
      <IconTrash size={14} />
      Remove Exercise
    </Button>
  {/if}
</div>

<AlertDialog bind:open={confirmRemoveOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Remove Exercise</AlertDialogTitle>
      <AlertDialogDescription>
        Remove {exercise?.exerciseName ?? 'this exercise'} and all its sets from this session?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onclick={() => onRemoveExercise?.()}>Remove</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
