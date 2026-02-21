<!--
  @component

  Summary card showing stats grid and optional Create / Save buttons.
-->
<script lang="ts">
  import AlertDialog from '$ui/AlertDialog/AlertDialog.svelte';
  import AlertDialogAction from '$ui/AlertDialog/AlertDialogAction.svelte';
  import AlertDialogCancel from '$ui/AlertDialog/AlertDialogCancel.svelte';
  import AlertDialogContent from '$ui/AlertDialog/AlertDialogContent.svelte';
  import AlertDialogDescription from '$ui/AlertDialog/AlertDialogDescription.svelte';
  import AlertDialogFooter from '$ui/AlertDialog/AlertDialogFooter.svelte';
  import AlertDialogHeader from '$ui/AlertDialog/AlertDialogHeader.svelte';
  import AlertDialogTitle from '$ui/AlertDialog/AlertDialogTitle.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import Separator from '$ui/Separator/Separator.svelte';

  let {
    totalWeeks,
    totalSessions,
    uniqueExercises,
    sessionsPerCycle,
    cycleTypeLabel,
    isValid = false,
    onCreate,
    onSave
  }: {
    totalWeeks: number;
    totalSessions: number;
    uniqueExercises: number;
    sessionsPerCycle?: number;
    cycleTypeLabel: string;
    isValid?: boolean;
    onCreate?: () => void;
    onSave?: () => void;
  } = $props();

  const action = $derived(onCreate ?? onSave);
  const isCreateMode = $derived(!!onCreate);
  const needsMoreExercises = $derived(
    sessionsPerCycle !== undefined && uniqueExercises > 0 && uniqueExercises < sessionsPerCycle
  );

  let confirmOpen = $state(false);
</script>

<Card>
  <CardHeader>
    <CardTitle>Summary</CardTitle>
  </CardHeader>
  <CardContent class="flex flex-col gap-4">
    <div class="grid grid-cols-2 gap-3">
      <div class="flex flex-col">
        <span class="text-xs text-muted-foreground">Total Duration</span>
        <span class="text-sm font-medium">{totalWeeks} weeks</span>
      </div>
      <div class="flex flex-col">
        <span class="text-xs text-muted-foreground">Total Sessions</span>
        <span class="text-sm font-medium">{totalSessions}</span>
      </div>
      <div class="flex flex-col">
        <span class="text-xs text-muted-foreground">Unique Exercises</span>
        <span class="text-sm font-medium">{uniqueExercises}</span>
      </div>
      <div class="flex flex-col">
        <span class="text-xs text-muted-foreground">Cycle Type</span>
        <span class="text-sm font-medium">{cycleTypeLabel}</span>
      </div>
    </div>

    {#if action}
      <Separator />
      {#if needsMoreExercises}
        <p class="text-sm text-destructive">
          Select at least {sessionsPerCycle} exercise{sessionsPerCycle !== 1 ? 's' : ''} to match the
          number of sessions per cycle. Add a variation of an existing exercise if needed.
        </p>
      {/if}
      <Button
        size="lg"
        class="w-full"
        disabled={!isValid || needsMoreExercises}
        onclick={() => (confirmOpen = true)}
      >
        {isCreateMode ? 'Create Mesocycle' : 'Save Changes'}
      </Button>
    {/if}
  </CardContent>
</Card>

{#if action}
  <AlertDialog bind:open={confirmOpen}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {isCreateMode ? 'Create this mesocycle?' : 'Save changes?'}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {#if isCreateMode}
            This will create a mesocycle with {totalSessions} sessions across {totalWeeks} weeks. Settings
            can be edited until you start the mesocycle.
          {:else}
            This will regenerate the mesocycle with {totalSessions} sessions across {totalWeeks}
            weeks. All existing session data will be replaced.
          {/if}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Go Back</AlertDialogCancel>
        <AlertDialogAction onclick={action}>
          {isCreateMode ? 'Create' : 'Save Changes'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
{/if}
