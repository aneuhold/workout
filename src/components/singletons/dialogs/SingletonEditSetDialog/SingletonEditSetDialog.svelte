<!--
  @component

  Singleton dialog for editing a previously logged set during an active session.
  Import `editSetDialog` and call `.open()` from any set row to trigger.
-->
<script lang="ts" module>
  let open = $state(false);
  let setNumber = $state(1);
  let hasRir = $state(false);
  let targetText = $state<string | null>(null);
  let editWeight = $state<number | undefined>(undefined);
  let editReps = $state<number | undefined>(undefined);
  let editRir = $state<number | undefined>(undefined);
  let onSave = $state<((weight: number, reps: number, rir: number | null) => void) | null>(null);

  export const editSetDialog = {
    open: (params: {
      setNumber: number;
      weight: number | undefined;
      reps: number | undefined;
      rir: number | undefined;
      hasRir: boolean;
      targetText: string | null;
      onSave: (weight: number, reps: number, rir: number | null) => void;
    }) => {
      setNumber = params.setNumber;
      editWeight = params.weight;
      editReps = params.reps;
      editRir = params.rir;
      hasRir = params.hasRir;
      targetText = params.targetText;
      onSave = params.onSave;
      open = true;
    }
  };
</script>

<script lang="ts">
  import Alert from '$ui/Alert/Alert.svelte';
  import AlertDescription from '$ui/Alert/AlertDescription.svelte';
  import AlertDialog from '$ui/AlertDialog/AlertDialog.svelte';
  import AlertDialogAction from '$ui/AlertDialog/AlertDialogAction.svelte';
  import AlertDialogCancel from '$ui/AlertDialog/AlertDialogCancel.svelte';
  import AlertDialogContent from '$ui/AlertDialog/AlertDialogContent.svelte';
  import AlertDialogDescription from '$ui/AlertDialog/AlertDialogDescription.svelte';
  import AlertDialogFooter from '$ui/AlertDialog/AlertDialogFooter.svelte';
  import AlertDialogHeader from '$ui/AlertDialog/AlertDialogHeader.svelte';
  import AlertDialogTitle from '$ui/AlertDialog/AlertDialogTitle.svelte';
  import Input from '$ui/Input/Input.svelte';

  let canSave = $derived(editWeight != null && editReps != null && (editRir != null || !hasRir));

  function handleConfirm() {
    if (editWeight != null && editReps != null && (editRir != null || !hasRir)) {
      onSave?.(editWeight, editReps, editRir ?? null);
    }
    open = false;
  }
</script>

<AlertDialog bind:open>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Edit Set {setNumber}</AlertDialogTitle>
      <AlertDialogDescription>
        <Alert variant="warn" class="mb-3">
          <AlertDescription>
            This is for correcting mistakes only. Editing won't be available after session
            completion.
          </AlertDescription>
        </Alert>
        {#if targetText}
          <span class="text-muted-foreground">{targetText}</span>
        {/if}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <div class="flex flex-col gap-3 py-2">
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Weight (lb)</span>
        <Input type="number" bind:value={editWeight} placeholder="lb" min={0} />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Reps</span>
        <Input type="number" bind:value={editReps} placeholder="reps" min={0} />
      </label>
      {#if hasRir}
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">RIR</span>
          <Input type="number" bind:value={editRir} placeholder="RIR" min={0} max={10} />
        </label>
      {/if}
    </div>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction disabled={!canSave} onclick={handleConfirm}>Save</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
