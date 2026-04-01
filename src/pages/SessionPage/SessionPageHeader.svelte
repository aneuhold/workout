<!--
  @component

  Header for the session page with back button, title, and optional description.
  For free-form sessions, also shows a 3-dot overflow menu with rename, edit, and delete actions.
-->
<script lang="ts">
  import type { WorkoutSession } from '@aneuhold/core-ts-db-lib';
  import { IconArrowLeft } from '@tabler/icons-svelte';
  import { goto } from '$app/navigation';
  import OptionsButtonDropdownMenu from '$components/OptionsButtonDropdownMenu/OptionsButtonDropdownMenu.svelte';
  import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';
  import WorkoutAPIService from '$services/WorkoutAPIService';
  import AlertDialog from '$ui/AlertDialog/AlertDialog.svelte';
  import AlertDialogAction from '$ui/AlertDialog/AlertDialogAction.svelte';
  import AlertDialogCancel from '$ui/AlertDialog/AlertDialogCancel.svelte';
  import AlertDialogContent from '$ui/AlertDialog/AlertDialogContent.svelte';
  import AlertDialogDescription from '$ui/AlertDialog/AlertDialogDescription.svelte';
  import AlertDialogFooter from '$ui/AlertDialog/AlertDialogFooter.svelte';
  import AlertDialogHeader from '$ui/AlertDialog/AlertDialogHeader.svelte';
  import AlertDialogTitle from '$ui/AlertDialog/AlertDialogTitle.svelte';
  import Button, { buttonVariants } from '$ui/Button/Button.svelte';
  import Dialog from '$ui/Dialog/Dialog.svelte';
  import DialogClose from '$ui/Dialog/DialogClose.svelte';
  import DialogContent from '$ui/Dialog/DialogContent.svelte';
  import DialogFooter from '$ui/Dialog/DialogFooter.svelte';
  import DialogHeader from '$ui/Dialog/DialogHeader.svelte';
  import DialogTitle from '$ui/Dialog/DialogTitle.svelte';
  import DropdownMenuItem from '$ui/DropdownMenu/DropdownMenuItem.svelte';
  import Input from '$ui/Input/Input.svelte';
  import { SessionPageMode } from './sessionPageTypes';

  let {
    title,
    description,
    isFreeForm = false,
    mode = SessionPageMode.Active,
    session = undefined
  }: {
    title: string;
    description?: string | null;
    isFreeForm?: boolean;
    mode?: SessionPageMode;
    session?: WorkoutSession;
  } = $props();

  let renameDialogOpen = $state(false);
  let deleteDialogOpen = $state(false);
  let newTitle = $state('');

  const saveDisabled = $derived(!newTitle.trim() || newTitle.trim() === title);

  /**
   * Opens the rename dialog pre-filled with the current session title.
   */
  function openRenameDialog() {
    newTitle = title;
    renameDialogOpen = true;
  }

  /**
   * Saves the new session title and persists it to the backend.
   */
  function handleRename() {
    if (!session || saveDisabled) return;
    const trimmed = newTitle.trim();
    session.title = trimmed;
    const apiOptions = sessionMapService.prepareDocsForSave({ update: [session] });
    WorkoutAPIService.queryApi(apiOptions);
    renameDialogOpen = false;
  }

  /**
   * Re-opens a completed session for editing by setting complete = false.
   */
  function handleEditSession() {
    if (!session) return;
    sessionMapService.updateDoc(session._id, (doc) => {
      doc.complete = false;
      return doc;
    });
  }

  /**
   * Deletes the free-form session and all associated data, then navigates away.
   */
  function handleDelete() {
    if (!session) return;
    sessionMapService.deleteFreeFormSession(session._id);
    deleteDialogOpen = false;
    goto('/sessions');
  }
</script>

<div class="flex items-center gap-2">
  <Button variant="ghost" size="sm" onclick={() => history.back()}>
    <IconArrowLeft size={16} />
  </Button>
  <div class="flex min-w-0 flex-1 flex-col">
    <h1 class="truncate text-xl font-semibold">{title}</h1>
    {#if description}
      <p class="text-sm text-muted-foreground">{description}</p>
    {/if}
  </div>
  {#if isFreeForm && session}
    <OptionsButtonDropdownMenu ariaLabel="Session actions">
      <DropdownMenuItem onclick={openRenameDialog}>Rename Session</DropdownMenuItem>
      {#if mode === SessionPageMode.View}
        <DropdownMenuItem onclick={handleEditSession}>Edit Session</DropdownMenuItem>
      {/if}
      <DropdownMenuItem
        class="text-destructive focus:text-destructive"
        onclick={() => (deleteDialogOpen = true)}
      >
        Delete Session
      </DropdownMenuItem>
    </OptionsButtonDropdownMenu>
  {/if}
</div>

<!-- Rename Dialog -->
<Dialog bind:open={renameDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Rename Session</DialogTitle>
    </DialogHeader>
    <Input bind:value={newTitle} placeholder="Session title" />
    <DialogFooter>
      <DialogClose class={buttonVariants({ variant: 'outline' })}>Cancel</DialogClose>
      <Button onclick={handleRename} disabled={saveDisabled}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<!-- Delete Confirmation Dialog -->
<AlertDialog bind:open={deleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete session?</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete "{title}"? This will remove all exercises and sets. This
        action cannot be undone.
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
