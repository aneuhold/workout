<!--
  @component

  Storybook wrapper that opens the SingletonMoveSessionsDialog with
  configurable parameters via buttons.
-->
<script lang="ts" module>
  export enum MoveSessionsStoryMode {
    Late = 'late',
    SeverelyLate = 'severelyLate',
    Error = 'error'
  }
</script>

<script lang="ts">
  import { WorkoutSessionSchema } from '@aneuhold/core-ts-db-lib';
  import { DateService } from '@aneuhold/core-ts-lib';
  import TestUsers from '$testUtils/TestUsers';
  import Button from '$ui/Button/Button.svelte';
  import SingletonMoveSessionsDialog from './SingletonMoveSessionsDialog.svelte';
  import { moveSessionsDialog } from './SingletonMoveSessionsDialog.svelte';

  let { storyMode = MoveSessionsStoryMode.Late }: { storyMode?: MoveSessionsStoryMode } = $props();

  const mockSession = WorkoutSessionSchema.parse({
    userId: TestUsers.currentUserCto._id,
    title: 'Upper Push A',
    startTime: new Date()
  });

  const daysLateMap: Record<MoveSessionsStoryMode, number> = {
    [MoveSessionsStoryMode.Late]: 2,
    [MoveSessionsStoryMode.SeverelyLate]: 5,
    [MoveSessionsStoryMode.Error]: 2
  };

  function openDialog() {
    const daysLate = daysLateMap[storyMode];
    const scheduledDate = DateService.addDays(new Date(), -daysLate);
    const mesocycleEndDate = DateService.addDays(new Date(), 21);
    const newMesocycleEndDate = DateService.addDays(mesocycleEndDate, daysLate);

    moveSessionsDialog.open({
      session: mockSession,
      daysLate,
      scheduledDate,
      mesocycleEndDate,
      newMesocycleEndDate,
      hasFutureMesocycles: true,
      onMove: async () => {
        await new Promise((resolve, reject) =>
          setTimeout(storyMode === MoveSessionsStoryMode.Error ? reject : resolve, 1500)
        );
      },
      onSkip: () => {},
      onDeload: daysLate >= 3 ? () => {} : undefined
    });
  }
</script>

<div class="flex flex-col gap-3 p-4">
  <h3 class="text-sm font-medium">Move Sessions Dialog</h3>
  <Button onclick={openDialog} data-testid="open-dialog-button">
    Open Dialog ({storyMode === MoveSessionsStoryMode.Late
      ? '2 Days Late'
      : storyMode === MoveSessionsStoryMode.SeverelyLate
        ? '5 Days Late'
        : 'Error on Confirm'})
  </Button>
</div>
<SingletonMoveSessionsDialog />
