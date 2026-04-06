<!--
  @component

  Storybook wrapper that opens the SingletonDeloadDialog with
  configurable parameters via buttons.
-->
<script lang="ts" module>
  export enum DeloadDialogStoryMode {
    WithScheduled = 'withScheduled',
    ImmediateOnly = 'immediateOnly',
    Error = 'error',
    Suggested = 'suggested',
    Recommended = 'recommended',
    Urgent = 'urgent'
  }
</script>

<script lang="ts">
  import { WorkoutDeloadSeverity, WorkoutDeloadTriggerRule } from '@aneuhold/core-ts-db-lib';
  import { DateService } from '@aneuhold/core-ts-lib';
  import Button from '$ui/Button/Button.svelte';
  import { deloadDialog } from './SingletonDeloadDialog.svelte';
  import SingletonDeloadDialog from './SingletonDeloadDialog.svelte';

  let { storyMode = DeloadDialogStoryMode.WithScheduled }: { storyMode?: DeloadDialogStoryMode } =
    $props();

  const storyModeLabels: Record<DeloadDialogStoryMode, string> = {
    [DeloadDialogStoryMode.WithScheduled]: 'Both Date Options',
    [DeloadDialogStoryMode.ImmediateOnly]: 'Immediate Only',
    [DeloadDialogStoryMode.Error]: 'Error on Confirm',
    [DeloadDialogStoryMode.Suggested]: 'Fatigue — Suggested',
    [DeloadDialogStoryMode.Recommended]: 'Fatigue — Recommended',
    [DeloadDialogStoryMode.Urgent]: 'Fatigue — Urgent'
  };

  const severityMap: Partial<Record<DeloadDialogStoryMode, WorkoutDeloadSeverity>> = {
    [DeloadDialogStoryMode.Suggested]: WorkoutDeloadSeverity.Suggested,
    [DeloadDialogStoryMode.Recommended]: WorkoutDeloadSeverity.Recommended,
    [DeloadDialogStoryMode.Urgent]: WorkoutDeloadSeverity.Urgent
  };

  const triggeredRulesMap: Partial<Record<DeloadDialogStoryMode, WorkoutDeloadTriggerRule[]>> = {
    [DeloadDialogStoryMode.Suggested]: [WorkoutDeloadTriggerRule.RecoverySessionThreshold],
    [DeloadDialogStoryMode.Recommended]: [WorkoutDeloadTriggerRule.ConsecutivePerformanceDrop],
    [DeloadDialogStoryMode.Urgent]: [
      WorkoutDeloadTriggerRule.RecoverySessionThreshold,
      WorkoutDeloadTriggerRule.ConsecutivePerformanceDrop
    ]
  };

  function openDialog() {
    const scheduledDeloadDate =
      storyMode !== DeloadDialogStoryMode.ImmediateOnly && !severityMap[storyMode]
        ? DateService.addDays(new Date(), 14)
        : null;

    deloadDialog.open({
      mesocycleTitle: 'Hypertrophy Block',
      scheduledDeloadDate,
      onConfirm: async () => {
        await new Promise((resolve, reject) =>
          setTimeout(storyMode === DeloadDialogStoryMode.Error ? reject : resolve, 1500)
        );
      },
      severity: severityMap[storyMode],
      triggeredRules: triggeredRulesMap[storyMode]
    });
  }
</script>

<div class="flex flex-col gap-3 p-4">
  <h3 class="text-sm font-medium">Deload Dialog</h3>
  <Button onclick={openDialog} data-testid="open-dialog-button">
    Open Dialog ({storyModeLabels[storyMode]})
  </Button>
</div>
<SingletonDeloadDialog />
