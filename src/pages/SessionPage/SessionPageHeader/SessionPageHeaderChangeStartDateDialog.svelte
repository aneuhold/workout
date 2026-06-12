<!--
  @component

  Dialog for changing the start date of a free-form session from the options menu
  (non-Planning mode). Wraps SessionPageStartDatePicker and persists the updated
  startTime on save.
-->
<script lang="ts">
  import type { WorkoutSession } from '@aneuhold/core-ts-db-lib';
  import sessionMapService from '$services/documentMapServices/SessionMap.service.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Dialog from '$ui/Dialog/Dialog.svelte';
  import DialogContent from '$ui/Dialog/DialogContent.svelte';
  import DialogFooter from '$ui/Dialog/DialogFooter.svelte';
  import DialogHeader from '$ui/Dialog/DialogHeader.svelte';
  import DialogTitle from '$ui/Dialog/DialogTitle.svelte';
  import SessionPageStartDatePicker from './SessionPageStartDatePicker.svelte';

  let {
    open = $bindable(),
    session
  }: {
    open: boolean;
    session: WorkoutSession;
  } = $props();

  let pendingDate = $state<Date | undefined>(undefined);

  $effect(() => {
    if (open) {
      pendingDate = new Date(session.startTime);
    }
  });

  /**
   * Persists the new start date to the session and closes the dialog.
   */
  function handleSave() {
    if (!pendingDate) return;
    const dateToSave = pendingDate;
    sessionMapService.updateDoc(session._id, (doc) => {
      doc.startTime = dateToSave;
      return doc;
    });
    open = false;
  }
</script>

<Dialog bind:open>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Change Start Date</DialogTitle>
    </DialogHeader>
    {#if pendingDate}
      <SessionPageStartDatePicker
        startTime={pendingDate}
        onstartTimeChange={(date) => {
          pendingDate = date;
        }}
      />
    {/if}
    <DialogFooter>
      <Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
      <Button onclick={handleSave}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
