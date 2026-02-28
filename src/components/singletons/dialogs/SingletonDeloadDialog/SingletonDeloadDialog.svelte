<!--
  @component

  Singleton dialog for confirming an early deload. Can be opened in two modes:

  1. **Manual** — the user chooses to start a deload from the mesocycle page or
     the late-session flow. Shows date options when a scheduled deload date exists.
  2. **Fatigue warning** — the system detects elevated fatigue after a session
     completion and recommends a deload. Shows a severity-level alert and the
     specific fatigue indicators that triggered the recommendation.

  Import `deloadDialog` and call `.open()` from anywhere to trigger.
-->
<script lang="ts" module>
  import { WorkoutDeloadSeverity, WorkoutDeloadTriggerRule } from '@aneuhold/core-ts-db-lib';

  type DeloadChoice = 'now' | 'scheduled';

  type DeloadDialogParams = {
    /** Title of the mesocycle being deloaded. */
    mesocycleTitle: string;
    /** Scheduled deload date, if one exists. Shows a "start as scheduled" option when set. */
    scheduledDeloadDate: Date | null;
    /** Callback invoked when the user confirms the deload. */
    onConfirm: (startDate: DeloadChoice) => Promise<void>;
    /** Severity level from fatigue detection. When set, the dialog shows a fatigue warning. */
    severity?: WorkoutDeloadSeverity;
    /** Which fatigue detection rules triggered the recommendation. Displayed as explanatory text when present. */
    triggeredRules?: WorkoutDeloadTriggerRule[];
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
  import type { AlertVariant } from '$ui/Alert/Alert.svelte';
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

  const hasFatigueWarning = $derived(params?.severity != null);

  const dialogTitle = $derived(hasFatigueWarning ? 'Deload Recommended' : 'Start Deload Early');

  const severityAlertVariant: AlertVariant = $derived(
    params?.severity === WorkoutDeloadSeverity.Suggested ? 'warn' : 'destructive'
  );

  const severityReasonText = $derived.by(() => {
    switch (params?.severity) {
      case WorkoutDeloadSeverity.Suggested:
        return "Your body might be ready for a break. It's worth considering a deload soon.";
      case WorkoutDeloadSeverity.Recommended:
        return 'Signs of fatigue are building up. A deload would help you recover and come back stronger.';
      case WorkoutDeloadSeverity.Urgent:
        return 'Multiple signs point to high fatigue. Taking a deload now will set you up for better progress.';
      default:
        return null;
    }
  });

  const triggerRuleDescriptions: Record<WorkoutDeloadTriggerRule, string> = {
    [WorkoutDeloadTriggerRule.RecoverySessionThreshold]:
      'Many of your exercises have dropped to recovery doses.',
    [WorkoutDeloadTriggerRule.ConsecutivePerformanceDrop]:
      'Performance has been trending down across recent sessions.'
  };

  const triggeredRuleTexts = $derived(
    params?.triggeredRules?.map((rule) => triggerRuleDescriptions[rule]) ?? []
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
      <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
      <AlertDialogDescription>
        This will cut the remaining sessions in the current microcycle and transition into a deload
        week.
      </AlertDialogDescription>
    </AlertDialogHeader>

    {#if severityReasonText}
      <Alert variant={severityAlertVariant}>
        <AlertDescription>
          <p>{severityReasonText}</p>
          {#if triggeredRuleTexts.length > 0}
            <ul class="mt-2 list-disc pl-4 text-xs">
              {#each triggeredRuleTexts as text, i (i)}
                <li>{text}</li>
              {/each}
            </ul>
          {/if}
        </AlertDescription>
      </Alert>
    {/if}

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
