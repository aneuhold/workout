<!--
  @component

  Summary card showing stats grid and an optional Create Mesocycle button.
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
    cycleTypeLabel,
    isValid = false,
    onCreate
  }: {
    totalWeeks: number;
    totalSessions: number;
    uniqueExercises: number;
    cycleTypeLabel: string;
    isValid?: boolean;
    onCreate?: () => void;
  } = $props();

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

    {#if onCreate}
      <Separator />

      <Button size="lg" class="w-full" disabled={!isValid} onclick={() => (confirmOpen = true)}>
        Create Mesocycle
      </Button>
    {/if}
  </CardContent>
</Card>

{#if onCreate}
  <AlertDialog bind:open={confirmOpen}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Create this mesocycle?</AlertDialogTitle>
        <AlertDialogDescription>
          This will create a mesocycle with {totalSessions} sessions across {totalWeeks} weeks. Once created,
          settings like microcycle count, rest days, and session frequency cannot be changed.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Go Back</AlertDialogCancel>
        <AlertDialogAction onclick={onCreate}>Create</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
{/if}
