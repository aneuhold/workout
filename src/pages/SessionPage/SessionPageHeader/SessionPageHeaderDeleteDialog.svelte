<!--
  @component

  Confirmation dialog for deleting a session. Handles free-form sessions and
  incomplete mesocycle sessions, adapting the warning copy to the session's
  position within its mesocycle.
-->
<script lang="ts">
  import { CycleType, type WorkoutSession } from '@aneuhold/core-ts-db-lib';
  import { goto } from '$app/navigation';
  import mesocycleMapService from '$services/documentMapServices/MesocycleMap.service.svelte';
  import microcycleMapService from '$services/documentMapServices/MicrocycleMap.service.svelte';
  import sessionMapService from '$services/documentMapServices/SessionMap.service.svelte';
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

  type DeleteContext = {
    isFreeForm: boolean;
    description: string;
    warning: string | null;
  };

  const BASE_COPY =
    "This will remove the session along with its exercises and sets. This can't be undone.";

  const MESOCYCLE_DELETE_CONTEXT = {
    freeForm: { isFreeForm: true, description: BASE_COPY, warning: null },
    deload: { isFreeForm: false, description: BASE_COPY, warning: null },
    future: {
      isFreeForm: false,
      description: `${BASE_COPY} This session will be regenerated automatically when you finish the current microcycle, so deleting it now is low-risk.`,
      warning: null
    },
    current: {
      isFreeForm: false,
      description: BASE_COPY,
      warning:
        "Heads up: deleting a planned session in the microcycle you're actively training can skew the app's volume and fatigue calculations, so recommendations may be off for the rest of this mesocycle. Only delete if you're sure you won't run this session."
    }
  } as const satisfies Record<string, DeleteContext>;

  let {
    open = $bindable(),
    session
  }: {
    open: boolean;
    session: WorkoutSession;
  } = $props();

  const deleteContext: DeleteContext = $derived.by(() => {
    const microcycleId = session.workoutMicrocycleId;
    if (microcycleId == null) return MESOCYCLE_DELETE_CONTEXT.freeForm;

    const microcycle = microcycleMapService.getDoc(microcycleId);
    if (!microcycle?.workoutMesocycleId) return MESOCYCLE_DELETE_CONTEXT.freeForm;

    const mesocycle = mesocycleMapService.getDoc(microcycle.workoutMesocycleId);
    if (!mesocycle) return MESOCYCLE_DELETE_CONTEXT.freeForm;

    const orderedMicrocycles = microcycleMapService.getOrderedMicrocyclesForMesocycle(
      microcycle.workoutMesocycleId
    );
    const microcycleIndex = orderedMicrocycles.findIndex((mc) => mc._id === microcycleId);
    if (microcycleIndex === -1) return MESOCYCLE_DELETE_CONTEXT.freeForm;

    const lastCycleIsDeload = mesocycle.cycleType !== CycleType.Resensitization;
    const isDeload = lastCycleIsDeload && microcycleIndex === orderedMicrocycles.length - 1;
    if (isDeload) return MESOCYCLE_DELETE_CONTEXT.deload;

    const currentIndex = orderedMicrocycles.findIndex((mc) => mc.completedDate == null);
    if (currentIndex !== -1 && microcycleIndex > currentIndex)
      return MESOCYCLE_DELETE_CONTEXT.future;

    return MESOCYCLE_DELETE_CONTEXT.current;
  });

  /**
   * Deletes the session and all associated data. Free-form sessions return to
   * the sessions list; mesocycle sessions go back to whatever launched them.
   */
  function handleDelete() {
    const apiOptions = deleteContext.isFreeForm
      ? undefined
      : microcycleMapService.prepareDeleteSessionFromMicrocycle(session._id);
    open = false;
    if (deleteContext.isFreeForm) {
      void goto('/sessions');
    } else {
      history.back();
    }
    sessionMapService.deleteSession(session._id, apiOptions);
  }
</script>

<AlertDialog bind:open>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete "{session.title}"?</AlertDialogTitle>
      <AlertDialogDescription>
        {deleteContext.description}
      </AlertDialogDescription>
    </AlertDialogHeader>
    {#if deleteContext.warning}
      <Alert variant="destructive">
        <AlertDescription>{deleteContext.warning}</AlertDescription>
      </Alert>
    {/if}
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
