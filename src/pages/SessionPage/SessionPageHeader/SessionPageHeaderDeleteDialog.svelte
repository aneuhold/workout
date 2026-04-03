<!--
  @component

  Confirmation dialog for deleting a free-form session.
-->
<script lang="ts">
  import type { WorkoutSession } from '@aneuhold/core-ts-db-lib';
  import { goto } from '$app/navigation';
  import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';
  import AlertDialog from '$ui/AlertDialog/AlertDialog.svelte';
  import AlertDialogAction from '$ui/AlertDialog/AlertDialogAction.svelte';
  import AlertDialogCancel from '$ui/AlertDialog/AlertDialogCancel.svelte';
  import AlertDialogContent from '$ui/AlertDialog/AlertDialogContent.svelte';
  import AlertDialogDescription from '$ui/AlertDialog/AlertDialogDescription.svelte';
  import AlertDialogFooter from '$ui/AlertDialog/AlertDialogFooter.svelte';
  import AlertDialogHeader from '$ui/AlertDialog/AlertDialogHeader.svelte';
  import AlertDialogTitle from '$ui/AlertDialog/AlertDialogTitle.svelte';

  let {
    open = $bindable(),
    session
  }: {
    open: boolean;
    session: WorkoutSession;
  } = $props();

  /**
   * Deletes the free-form session and all associated data, then navigates to sessions list.
   */
  function handleDelete() {
    sessionMapService.deleteFreeFormSession(session._id);
    open = false;
    void goto('/sessions');
  }
</script>

<AlertDialog bind:open>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete session?</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete "{session.title}"? This will remove all exercises and sets.
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onclick={handleDelete}
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
