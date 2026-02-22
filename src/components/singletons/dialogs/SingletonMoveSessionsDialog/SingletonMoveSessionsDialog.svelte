<!--
  @component

  Singleton dialog that offers options when a session is late.
  The user can choose to shift the schedule forward or start a deload,
  then either apply the selected option or just start the session as-is.
  Import `moveSessionsDialog` and call `.open()` from anywhere to trigger.
-->
<script lang="ts" module>
  import type { WorkoutSession } from '@aneuhold/core-ts-db-lib';

  export enum MoveSessionsDialogAction {
    Move = 'move',
    Deload = 'deload',
    Skip = 'skip'
  }

  type MoveSessionsDialogParams = {
    session: WorkoutSession;
    daysLate: number;
    scheduledDate: Date;
    mesocycleEndDate: Date | null;
    newMesocycleEndDate: Date | null;
    hasFutureMesocycles: boolean;
    onMove: () => Promise<void>;
    onSkip: () => void;
    onDeload?: () => void;
  };

  let dialogOpen = $state(false);
  let params = $state<MoveSessionsDialogParams | null>(null);
  let moving = $state(false);
  let errorMessage = $state<string | null>(null);
  let selectedAction = $state<MoveSessionsDialogAction>(MoveSessionsDialogAction.Move);

  export const moveSessionsDialog = {
    /**
     * Opens the move sessions dialog with the given parameters.
     *
     * @param dialogParams Configuration for the dialog content and callbacks.
     */
    open: (dialogParams: MoveSessionsDialogParams) => {
      params = dialogParams;
      dialogOpen = true;
      moving = false;
      errorMessage = null;
      selectedAction = MoveSessionsDialogAction.Move;
    }
  };
</script>

<script lang="ts">
  import Alert from '$ui/Alert/Alert.svelte';
  import AlertDescription from '$ui/Alert/AlertDescription.svelte';
  import AlertDialog from '$ui/AlertDialog/AlertDialog.svelte';
  import AlertDialogCancel from '$ui/AlertDialog/AlertDialogCancel.svelte';
  import AlertDialogContent from '$ui/AlertDialog/AlertDialogContent.svelte';
  import AlertDialogDescription from '$ui/AlertDialog/AlertDialogDescription.svelte';
  import AlertDialogFooter from '$ui/AlertDialog/AlertDialogFooter.svelte';
  import AlertDialogHeader from '$ui/AlertDialog/AlertDialogHeader.svelte';
  import AlertDialogTitle from '$ui/AlertDialog/AlertDialogTitle.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Label from '$ui/Label/Label.svelte';
  import RadioGroup from '$ui/RadioGroup/RadioGroup.svelte';
  import RadioGroupItem from '$ui/RadioGroup/RadioGroupItem.svelte';

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const scheduledFormatted = $derived(params ? formatDate(params.scheduledDate) : '');

  const oldEndFormatted = $derived(
    params?.mesocycleEndDate ? formatDate(params.mesocycleEndDate) : null
  );

  const newEndFormatted = $derived(
    params?.newMesocycleEndDate ? formatDate(params.newMesocycleEndDate) : null
  );

  const showDeloadOption = $derived((params?.daysLate ?? 0) >= 3 && params?.onDeload != null);

  const daysLabel = $derived(
    (params?.daysLate ?? 0) === 1 ? '1 day' : `${params?.daysLate ?? 0} days`
  );

  async function handleConfirm() {
    if (!params) return;
    if (selectedAction === MoveSessionsDialogAction.Skip) {
      params.onSkip();
      dialogOpen = false;
      return;
    }
    if (selectedAction === MoveSessionsDialogAction.Deload) {
      params.onDeload?.();
      dialogOpen = false;
      return;
    }
    moving = true;
    errorMessage = null;
    try {
      await params.onMove();
      dialogOpen = false;
    } catch {
      errorMessage = 'Something went wrong. Please try again.';
      moving = false;
    }
  }
</script>

<AlertDialog bind:open={dialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        You're {daysLabel} behind schedule
      </AlertDialogTitle>
      <AlertDialogDescription>
        Your next session was scheduled for <strong>{scheduledFormatted}</strong>. Choose how you'd
        like to proceed.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <RadioGroup bind:value={selectedAction} class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <RadioGroupItem value={MoveSessionsDialogAction.Move} id="action-move" />
        <Label for="action-move" class="flex items-start flex-col gap-0.5">
          <span class="font-medium">Move schedule forward by {daysLabel}</span>
          <span class="text-xs text-muted-foreground">
            {#if oldEndFormatted && newEndFormatted}
              Mesocycle end date shifts from {oldEndFormatted} to {newEndFormatted}
            {:else}
              Remaining sessions shift forward by {daysLabel}
            {/if}
          </span>
        </Label>
      </div>
      {#if showDeloadOption}
        <div class="flex items-center gap-2">
          <RadioGroupItem value={MoveSessionsDialogAction.Deload} id="action-deload" />
          <Label for="action-deload" class="flex items-start flex-col gap-0.5">
            <span class="font-medium">Start deload</span>
            <span class="text-xs text-muted-foreground">
              Cut the rest of this mesocycle and transition into a deload week
            </span>
          </Label>
        </div>
      {/if}
      <div class="flex items-center gap-2">
        <RadioGroupItem value={MoveSessionsDialogAction.Skip} id="action-skip" />
        <Label for="action-skip" class="flex items-start flex-col gap-0.5">
          <span class="font-medium">Start session without changes</span>
          <span class="text-xs text-muted-foreground">
            Begin the session as-is without adjusting the schedule
          </span>
        </Label>
      </div>
    </RadioGroup>

    {#if errorMessage}
      <Alert variant="destructive">
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    {/if}

    <AlertDialogFooter>
      <AlertDialogCancel disabled={moving}>Cancel</AlertDialogCancel>
      <Button onclick={handleConfirm} disabled={moving}>
        {moving ? 'Applying...' : 'Confirm'}
      </Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
