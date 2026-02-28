<!--
  @component

  Storybook wrapper that opens the SingletonDeloadDialog with
  configurable parameters via buttons.
-->
<script lang="ts">
  import { WorkoutDeloadSeverity, WorkoutDeloadTriggerRule } from '@aneuhold/core-ts-db-lib';
  import { DateService } from '@aneuhold/core-ts-lib';
  import Button from '$ui/Button/Button.svelte';
  import { deloadDialog } from './SingletonDeloadDialog.svelte';
  import SingletonDeloadDialog from './SingletonDeloadDialog.svelte';

  type StoryMode =
    | 'withScheduled'
    | 'immediateOnly'
    | 'error'
    | 'suggested'
    | 'recommended'
    | 'urgent';

  let { storyMode = 'withScheduled' }: { storyMode?: StoryMode } = $props();

  const storyModeLabels: Record<StoryMode, string> = {
    withScheduled: 'Both Date Options',
    immediateOnly: 'Immediate Only',
    error: 'Error on Confirm',
    suggested: 'Fatigue — Suggested',
    recommended: 'Fatigue — Recommended',
    urgent: 'Fatigue — Urgent'
  };

  const severityMap: Partial<Record<StoryMode, WorkoutDeloadSeverity>> = {
    suggested: WorkoutDeloadSeverity.Suggested,
    recommended: WorkoutDeloadSeverity.Recommended,
    urgent: WorkoutDeloadSeverity.Urgent
  };

  const triggeredRulesMap: Partial<Record<StoryMode, WorkoutDeloadTriggerRule[]>> = {
    suggested: [WorkoutDeloadTriggerRule.RecoverySessionThreshold],
    recommended: [WorkoutDeloadTriggerRule.ConsecutivePerformanceDrop],
    urgent: [
      WorkoutDeloadTriggerRule.RecoverySessionThreshold,
      WorkoutDeloadTriggerRule.ConsecutivePerformanceDrop
    ]
  };

  function openDialog() {
    const scheduledDeloadDate =
      storyMode !== 'immediateOnly' && !severityMap[storyMode]
        ? DateService.addDays(new Date(), 14)
        : null;

    deloadDialog.open({
      mesocycleTitle: 'Hypertrophy Block',
      scheduledDeloadDate,
      onConfirm: async () => {
        await new Promise((resolve, reject) =>
          setTimeout(storyMode === 'error' ? reject : resolve, 1500)
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
