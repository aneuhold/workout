<!--
  @component

  Storybook wrapper that opens the SingletonRescheduleMesocycleDialog with
  configurable parameters via a button.
-->
<script lang="ts" module>
  export enum RescheduleMesocycleStoryMode {
    NoOverlap = 'noOverlap',
    WithOverlap = 'withOverlap'
  }
</script>

<script lang="ts">
  import { DateService } from '@aneuhold/core-ts-lib';
  import { getLocalTimeZone } from '@internationalized/date';
  import Button from '$ui/Button/Button.svelte';
  import { rescheduleMesocycleDialog } from './SingletonRescheduleMesocycleDialog.svelte';
  import SingletonRescheduleMesocycleDialog from './SingletonRescheduleMesocycleDialog.svelte';

  let {
    storyMode = RescheduleMesocycleStoryMode.NoOverlap
  }: { storyMode?: RescheduleMesocycleStoryMode } = $props();

  const storyModeLabels: Record<RescheduleMesocycleStoryMode, string> = {
    [RescheduleMesocycleStoryMode.NoOverlap]: 'No Overlap',
    [RescheduleMesocycleStoryMode.WithOverlap]: 'With Overlap'
  };

  const tz = getLocalTimeZone();
  const currentStartDate = DateService.addDays(new Date(), 7);
  const mesocycleDurationDays = 42;

  // A blocked range that simulates an adjacent mesocycle starting 50 days out.
  const blockedStart = DateService.addDays(currentStartDate, 50);
  const blockedEnd = DateService.addDays(blockedStart, 42);

  function openDialog() {
    rescheduleMesocycleDialog.open({
      currentStartDate,
      mesocycleDurationDays,
      isDateDisabled:
        storyMode === RescheduleMesocycleStoryMode.WithOverlap
          ? (dateValue) => {
              const date = dateValue.toDate(tz);
              return (
                date.getTime() >= blockedStart.getTime() && date.getTime() < blockedEnd.getTime()
              );
            }
          : () => false,
      onReschedule: (newStartDate) => {
        console.log('Rescheduled to:', newStartDate.toLocaleDateString());
      }
    });
  }
</script>

<div class="flex flex-col gap-3 p-4">
  <h3 class="text-sm font-medium">Reschedule Mesocycle Dialog</h3>
  <Button onclick={openDialog} data-testid="open-dialog-button">
    Open Dialog ({storyModeLabels[storyMode]})
  </Button>
</div>
<SingletonRescheduleMesocycleDialog />
