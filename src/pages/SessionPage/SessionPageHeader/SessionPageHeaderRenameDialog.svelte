<!--
  @component

  Dialog for renaming a free-form session.
-->
<script lang="ts">
  import type { WorkoutSession } from '@aneuhold/core-ts-db-lib';
  import sessionMapService from '$services/documentMapServices/SessionMap.service.svelte';
  import Button, { buttonVariants } from '$ui/Button/Button.svelte';
  import Dialog from '$ui/Dialog/Dialog.svelte';
  import DialogClose from '$ui/Dialog/DialogClose.svelte';
  import DialogContent from '$ui/Dialog/DialogContent.svelte';
  import DialogFooter from '$ui/Dialog/DialogFooter.svelte';
  import DialogHeader from '$ui/Dialog/DialogHeader.svelte';
  import DialogTitle from '$ui/Dialog/DialogTitle.svelte';
  import Input from '$ui/Input/Input.svelte';

  let {
    open = $bindable(),
    session
  }: {
    open: boolean;
    session: WorkoutSession;
  } = $props();

  let newTitle = $state('');

  $effect(() => {
    if (open) {
      newTitle = session.title;
    }
  });

  let saveDisabled = $derived(!newTitle.trim() || newTitle.trim() === session.title);

  /**
   * Saves the renamed session title and closes the dialog.
   */
  function handleRename() {
    if (saveDisabled) return;
    const trimmed = newTitle.trim();
    sessionMapService.updateDoc(session._id, (doc) => {
      doc.title = trimmed;
      return doc;
    });
    open = false;
  }
</script>

<Dialog bind:open>
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
