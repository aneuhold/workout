<!--
  @component

  Dialog for reordering session exercises via drag-and-drop.
  Uses svelte-dnd-action with drag handles for accessible reordering.
-->
<script lang="ts">
  import { IconGripVertical } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import { type DndEvent, dragHandle, dragHandleZone } from 'svelte-dnd-action';
  import Button from '$ui/Button/Button.svelte';
  import { buttonVariants } from '$ui/Button/Button.svelte';
  import Dialog from '$ui/Dialog/Dialog.svelte';
  import DialogClose from '$ui/Dialog/DialogClose.svelte';
  import DialogContent from '$ui/Dialog/DialogContent.svelte';
  import DialogFooter from '$ui/Dialog/DialogFooter.svelte';
  import DialogHeader from '$ui/Dialog/DialogHeader.svelte';
  import DialogTitle from '$ui/Dialog/DialogTitle.svelte';

  type ExerciseReorderInfo = { id: UUID; name: string };

  let {
    open = $bindable(),
    exerciseOrder,
    onSave
  }: {
    open: boolean;
    exerciseOrder: ExerciseReorderInfo[];
    onSave: (newOrder: UUID[]) => void;
  } = $props();

  let items = $state<ExerciseReorderInfo[]>([]);

  $effect(() => {
    if (open) {
      items = [...exerciseOrder];
    }
  });

  /**
   * Updates the local items list during and after drag operations.
   *
   * @param e The dnd consider or finalize event
   */
  function handleSort(e: CustomEvent<DndEvent<ExerciseReorderInfo>>) {
    items = e.detail.items;
  }

  /**
   * Saves the new exercise order and closes the dialog.
   */
  function handleSave() {
    onSave(items.map((item) => item.id));
    open = false;
  }
</script>

<Dialog bind:open>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Reorder Exercises</DialogTitle>
    </DialogHeader>
    <div
      class="flex max-h-[60vh] flex-col gap-1 overflow-y-auto"
      use:dragHandleZone={{ items, flipDurationMs: 200 }}
      onconsider={handleSort}
      onfinalize={handleSort}
    >
      {#each items as item (item.id)}
        <div class="flex items-center gap-2 rounded-md border bg-card px-3 py-2">
          <button
            use:dragHandle
            aria-label="Drag to reorder"
            class="cursor-grab text-muted-foreground active:cursor-grabbing"
          >
            <IconGripVertical size={18} />
          </button>
          <span class="text-sm">{item.name}</span>
        </div>
      {/each}
    </div>
    <DialogFooter>
      <DialogClose class={buttonVariants({ variant: 'outline' })}>Cancel</DialogClose>
      <Button onclick={handleSave}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
