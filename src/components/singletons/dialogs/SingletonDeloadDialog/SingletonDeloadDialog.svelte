<!--
  @component

  Singleton dialog for initiating an early deload. Lets the user choose between
  starting the deload immediately or at the originally scheduled date.
  Import `deloadDialog` and call `.open()` from anywhere to trigger.
-->
<script lang="ts" module>
  type DeloadChoice = 'now' | 'scheduled';

  type DeloadDialogParams = {
    mesocycleTitle: string;
    scheduledDeloadDate: Date | null;
    onConfirm: (startDate: DeloadChoice) => Promise<void>;
  };

  let dialogOpen = $state(false);
  let params = $state<DeloadDialogParams | null>(null);
  let confirming = $state(false);
  let errorMessage = $state<string | null>(null);
  let selected = $state<DeloadChoice>('now');

  export const deloadDialog = {
    /**
     * Opens the deload dialog with the given parameters.
     *
     * @param dialogParams Configuration for the dialog content and callbacks.
     */
    open: (dialogParams: DeloadDialogParams) => {
      params = dialogParams;
      dialogOpen = true;
      confirming = false;
      errorMessage = null;
      selected = 'now';
    }
  };
</script>

<script lang="ts">
  import AlertDialogAction from '$components/ui/AlertDialog/AlertDialogAction.svelte';
  import Alert from '$ui/Alert/Alert.svelte';
  import AlertDescription from '$ui/Alert/AlertDescription.svelte';
  import AlertDialog from '$ui/AlertDialog/AlertDialog.svelte';
  import AlertDialogCancel from '$ui/AlertDialog/AlertDialogCancel.svelte';
  import AlertDialogContent from '$ui/AlertDialog/AlertDialogContent.svelte';
  import AlertDialogDescription from '$ui/AlertDialog/AlertDialogDescription.svelte';
  import AlertDialogFooter from '$ui/AlertDialog/AlertDialogFooter.svelte';
  import AlertDialogHeader from '$ui/AlertDialog/AlertDialogHeader.svelte';
  import AlertDialogTitle from '$ui/AlertDialog/AlertDialogTitle.svelte';
  import Label from '$ui/Label/Label.svelte';
  import RadioGroup from '$ui/RadioGroup/RadioGroup.svelte';
  import RadioGroupItem from '$ui/RadioGroup/RadioGroupItem.svelte';

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const todayFormatted = $derived(formatDate(new Date()));

  const scheduledDateFormatted = $derived(
    params?.scheduledDeloadDate ? formatDate(params.scheduledDeloadDate) : null
  );

  const showScheduledOption = $derived(
    params?.scheduledDeloadDate != null && params.scheduledDeloadDate.getTime() > Date.now()
  );

  async function handleConfirm() {
    if (!params) return;
    confirming = true;
    errorMessage = null;
    try {
      await params.onConfirm(selected);
      dialogOpen = false;
    } catch (error) {
      console.error('Deload confirmation failed:', error);
      errorMessage = 'Something went wrong. Please try again.';
      confirming = false;
    }
  }
</script>

<AlertDialog bind:open={dialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Start Deload Early</AlertDialogTitle>
      <AlertDialogDescription>
        This will cut the remaining sessions in the current microcycle and transition into a deload
        week.
      </AlertDialogDescription>
    </AlertDialogHeader>

    {#if showScheduledOption}
      <p class="text-sm font-medium">When should the deload start?</p>

      <RadioGroup bind:value={selected} class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <RadioGroupItem value="now" id="deload-now" />
          <Label for="deload-now" class="flex items-start flex-col gap-0.5">
            <span class="font-medium">Start now</span>
            <span class="text-xs text-muted-foreground">
              Deload begins today ({todayFormatted})
            </span>
          </Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroupItem value="scheduled" id="deload-scheduled" />
          <Label for="deload-scheduled" class="flex items-start flex-col gap-0.5">
            <span class="font-medium">Start as scheduled</span>
            <span class="text-xs text-muted-foreground">
              Deload begins {scheduledDateFormatted}
            </span>
          </Label>
        </div>
      </RadioGroup>
    {:else}
      <p class="text-sm text-muted-foreground">
        The deload will start today ({todayFormatted}).
      </p>
    {/if}

    {#if errorMessage}
      <Alert variant="destructive">
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    {/if}

    <AlertDialogFooter>
      <AlertDialogCancel disabled={confirming}>Cancel</AlertDialogCancel>
      <AlertDialogAction onclick={handleConfirm} disabled={confirming}>
        {confirming ? 'Starting...' : 'Start Deload'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
