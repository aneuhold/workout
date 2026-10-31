<!--
  @component

  Storybook wrapper that opens the SingletonDeloadDialog with
  configurable parameters via buttons, for a mock mesocycle that has
  incomplete sessions.
-->
<script lang="ts" module>
  export enum DeloadDialogStoryMode {
    WithScheduled = 'withScheduled',
    ImmediateOnly = 'immediateOnly',
    Suggested = 'suggested',
    Recommended = 'recommended',
    Urgent = 'urgent'
  }
</script>

<script lang="ts">
  import {
    CycleType,
    WorkoutDeloadSeverity,
    WorkoutDeloadTriggerRule
  } from '@aneuhold/core-ts-db-lib';
  import { DateService } from '@aneuhold/core-ts-lib';
  import type { UUID } from 'crypto';
  import { untrack } from 'svelte';
  import mesocycleMapServiceMock from '$services/documentMapServices/MesocycleMap.service.mock';
  import MockDataService from '$services/MockDataService/MockData.service';
  import Button from '$ui/Button/Button.svelte';
  import { deloadDialog } from './SingletonDeloadDialog.svelte';

  let { storyMode = DeloadDialogStoryMode.WithScheduled }: { storyMode?: DeloadDialogStoryMode } =
    $props();

  const storyModeLabels: Record<DeloadDialogStoryMode, string> = {
    [DeloadDialogStoryMode.WithScheduled]: 'Both Date Options',
    [DeloadDialogStoryMode.ImmediateOnly]: 'Immediate Only',
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

  let mesocycleId = $state<UUID | null>(null);

  $effect(() => {
    untrack(() => {
      MockDataService.resetAll();
      const { mesocycle } = mesocycleMapServiceMock.generateFullMesocycle(
        MockDataService.setupBaseData(),
        {
          title: 'Hypertrophy Block',
          cycleType: CycleType.MuscleGain,
          microcycleCount: 4,
          startDate: DateService.addDays(new Date(), -14),
          completedSessionCount: 8
        }
      );
      mesocycleId = mesocycle._id;
    });

    return () => {
      untrack(() => {
        MockDataService.resetAll();
      });
    };
  });

  function openDialog() {
    if (!mesocycleId) return;

    const scheduledDeloadDate =
      storyMode !== DeloadDialogStoryMode.ImmediateOnly && !severityMap[storyMode]
        ? DateService.addDays(new Date(), 14)
        : null;

    deloadDialog.open({
      mesocycleId,
      scheduledDeloadDate,
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
