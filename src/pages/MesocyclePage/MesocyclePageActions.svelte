<!--
  @component

  Dropdown menu with management actions for a mesocycle. Shows different
  options based on mesocycle state: active (deload/end), future (delete),
  or completed (type-to-confirm delete).
-->
<script lang="ts">
  import type { WorkoutMesocycle, WorkoutMicrocycle } from '@aneuhold/core-ts-db-lib';
  import { CycleType, WorkoutMesocycleService } from '@aneuhold/core-ts-db-lib';
  import { DateService } from '@aneuhold/core-ts-lib';
  import { type DateValue, getLocalTimeZone } from '@internationalized/date';
  import { IconCalendarEvent, IconMoon, IconSquareX, IconTrash } from '@tabler/icons-svelte';
  import { goto } from '$app/navigation';
  import OptionsButtonDropdownMenu from '$components/OptionsButtonDropdownMenu/OptionsButtonDropdownMenu.svelte';
  import { deloadDialog } from '$components/singletons/dialogs/SingletonDeloadDialog/SingletonDeloadDialog.svelte';
  import { rescheduleMesocycleDialog } from '$components/singletons/dialogs/SingletonRescheduleMesocycleDialog/SingletonRescheduleMesocycleDialog.svelte';
  import mesocycleMapService from '$services/documentMapServices/MesocycleMap.service.svelte';
  import microcycleMapService from '$services/documentMapServices/MicrocycleMap.service.svelte';
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
  import Button from '$ui/Button/Button.svelte';
  import DropdownMenuItem from '$ui/DropdownMenu/DropdownMenuItem.svelte';
  import Input from '$ui/Input/Input.svelte';
  import { getMesocycleDurationDays, getRescheduleDisabledDateMatcher } from './mesocyclePageUtils';

  let {
    mesocycle,
    microcycles
  }: {
    mesocycle: WorkoutMesocycle;
    microcycles: WorkoutMicrocycle[];
  } = $props();

  const isActive = $derived(mesocycle.startDate != null && mesocycle.completedDate == null);
  const isFuture = $derived(mesocycle.startDate == null && mesocycle.completedDate == null);
  const isCompleted = $derived(mesocycle.completedDate != null);

  let endMesocycleDialogOpen = $state(false);
  let deleteMesocycleDialogOpen = $state(false);
  let deleteCompletedDialogOpen = $state(false);
  let confirmationText = $state('');
  const mesocycleTitle = $derived(mesocycle.title ?? 'Mesocycle');
  const confirmationMatches = $derived(confirmationText === mesocycleTitle);

  /**
   * Opens the deload singleton dialog for this mesocycle.
   */
  function handleStartDeload() {
    const lastMicrocycle = microcycles.length > 0 ? microcycles[microcycles.length - 1] : null;
    const scheduledDeloadDate = lastMicrocycle ? new Date(lastMicrocycle.startDate) : null;

    deloadDialog.open({
      mesocycleTitle: mesocycle.title ?? 'Mesocycle',
      scheduledDeloadDate,
      onConfirm: async (choice) => {
        const deloadStartDate = choice === 'now' ? new Date() : (scheduledDeloadDate ?? new Date());
        mesocycleMapService.initiateEarlyDeload(mesocycle._id, deloadStartDate);
        await goto('/mesocycles');
      }
    });
  }

  /**
   * Opens the reschedule dialog for this mesocycle.
   */
  function handleReschedule() {
    const microcycles = microcycleMapService.getOrderedMicrocyclesForMesocycle(mesocycle._id);
    const currentStart = WorkoutMesocycleService.getProjectedStartDate(mesocycle, microcycles);
    if (!currentStart) return;

    const durationDays = getMesocycleDurationDays(mesocycle, microcycles);
    const tz = getLocalTimeZone();
    const disabledMatcher = getRescheduleDisabledDateMatcher(
      mesocycle._id,
      durationDays,
      mesocycleMapService.allDocs,
      (id) => microcycleMapService.getOrderedMicrocyclesForMesocycle(id)
    );

    rescheduleMesocycleDialog.open({
      currentStartDate: currentStart,
      mesocycleDurationDays: durationDays,
      isDateDisabled: (dateValue: DateValue) => disabledMatcher(dateValue.toDate(tz)),
      onReschedule: (newStartDate: Date) => {
        const delta = DateService.getCalendarDaysBetween(currentStart, newStartDate);
        mesocycleMapService.moveMesocycle(mesocycle._id, delta, false);
      }
    });
  }

  /**
   * Ends the mesocycle immediately.
   */
  function handleEndMesocycle() {
    mesocycleMapService.endMesocycle(mesocycle._id);
    endMesocycleDialogOpen = false;
    goto('/mesocycles');
  }

  /**
   * Deletes a mesocycle and all its associated documents.
   */
  function handleDeleteMesocycle() {
    mesocycleMapService.deleteMesocycle(mesocycle._id);
    deleteMesocycleDialogOpen = false;
    deleteCompletedDialogOpen = false;
    confirmationText = '';
    goto('/mesocycles');
  }
</script>

<OptionsButtonDropdownMenu ariaLabel="Mesocycle actions">
  {#if isActive || isFuture}
    <DropdownMenuItem onclick={handleReschedule}>
      <IconCalendarEvent size={16} />
      Reschedule
    </DropdownMenuItem>
  {/if}
  {#if isActive && mesocycle.cycleType !== CycleType.FreeForm}
    <DropdownMenuItem onclick={handleStartDeload}>
      <IconMoon size={16} />
      Start Deload
    </DropdownMenuItem>
  {/if}
  {#if isActive}
    <DropdownMenuItem
      class="text-destructive focus:text-destructive"
      onclick={() => (endMesocycleDialogOpen = true)}
    >
      <IconSquareX size={16} />
      End Mesocycle
    </DropdownMenuItem>
  {/if}
  {#if isFuture || isCompleted}
    <DropdownMenuItem
      class="text-destructive focus:text-destructive"
      onclick={() => (deleteMesocycleDialogOpen = true)}
    >
      <IconTrash size={16} />
      Delete Mesocycle
    </DropdownMenuItem>
  {/if}
</OptionsButtonDropdownMenu>

<!-- End Mesocycle Confirmation Dialog -->
<AlertDialog bind:open={endMesocycleDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>End Mesocycle?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently end <strong>"{mesocycleTitle}"</strong>. All remaining incomplete
        sessions will be discarded. Completed sessions and their data will be preserved.
        <br /><br />
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onclick={handleEndMesocycle}
      >
        End Mesocycle
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

<!-- Delete Future Mesocycle Confirmation Dialog -->
<AlertDialog bind:open={deleteMesocycleDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Mesocycle?</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete <strong>"{mesocycleTitle}"</strong>? This will remove the
        mesocycle and all of its planned sessions.
        <br /><br />
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onclick={handleDeleteMesocycle}
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

<!-- Delete Completed Mesocycle Confirmation Dialog -->
<AlertDialog bind:open={deleteCompletedDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Mesocycle?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete <strong>"{mesocycleTitle}"</strong> and all associated data. This
        action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <Alert variant="destructive">
      <AlertDescription>
        <ul class="list-disc pl-4">
          <li>All session data, sets, and progression history permanently removed</li>
          <li>Metrics and analytics derived from this mesocycle will be affected</li>
          <li>1RM calculations that used data from this mesocycle may change</li>
          <li>Current and future mesocycle plans that referenced this data may be disrupted</li>
        </ul>
      </AlertDescription>
    </Alert>
    <p class="text-sm">Type the mesocycle title to confirm:</p>
    <Input bind:value={confirmationText} placeholder={mesocycleTitle} />
    <AlertDialogFooter>
      <AlertDialogCancel onclick={() => (confirmationText = '')}>Cancel</AlertDialogCancel>
      <Button variant="destructive" onclick={handleDeleteMesocycle} disabled={!confirmationMatches}>
        Delete
      </Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
