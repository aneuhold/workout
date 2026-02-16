<!--
  @component

  Summary card showing stats grid and the Create Mesocycle button.
-->
<script lang="ts">
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
    isValid,
    onCreate
  }: {
    totalWeeks: number;
    totalSessions: number;
    uniqueExercises: number;
    cycleTypeLabel: string;
    isValid: boolean;
    onCreate: () => void;
  } = $props();
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

    <Separator />

    <Button size="lg" class="w-full" disabled={!isValid} onclick={onCreate}>
      Create Mesocycle
    </Button>
  </CardContent>
</Card>
