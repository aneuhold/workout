<!--
  @component

  Configuration card for creating a new mesocycle.
  Handles title, cycle type, numeric config, and rest day selection.
-->
<script lang="ts">
  import { CycleType } from '@aneuhold/core-ts-db-lib';
  import InfoPopover from '$components/InfoPopover/InfoPopover.svelte';
  import { formatCycleType } from '$pages/MesocyclesPage/mesocyclesPageUtils';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import Input from '$ui/Input/Input.svelte';
  import Label from '$ui/Label/Label.svelte';
  import Select from '$ui/Select/Select.svelte';
  import SelectContent from '$ui/Select/SelectContent.svelte';
  import SelectItem from '$ui/Select/SelectItem.svelte';
  import SelectTrigger from '$ui/Select/SelectTrigger.svelte';

  let {
    title = $bindable(''),
    cycleType = $bindable<CycleType>(CycleType.MuscleGain),
    weeks = $bindable(6),
    sessionsPerWeek = $bindable(5),
    daysPerCycle = $bindable(7),
    restDays = $bindable<number[]>([0, 6])
  }: {
    title: string;
    cycleType: CycleType;
    weeks: number;
    sessionsPerWeek: number;
    daysPerCycle: number;
    restDays: number[];
  } = $props();

  // Trim rest days when daysPerCycle shrinks
  $effect(() => {
    const max = daysPerCycle;
    const trimmed = restDays.filter((day) => day < max);
    if (trimmed.length !== restDays.length) {
      restDays = trimmed;
    }
  });

  function toggleRestDay(dayIndex: number) {
    if (restDays.includes(dayIndex)) {
      restDays = restDays.filter((day) => day !== dayIndex);
    } else {
      restDays = [...restDays, dayIndex].sort((dayA, dayB) => dayA - dayB);
    }
  }

  const cycleTypeLabel = $derived(formatCycleType(cycleType));
</script>

<Card>
  <CardHeader>
    <CardTitle>Configuration</CardTitle>
  </CardHeader>
  <CardContent class="flex flex-col gap-4">
    <div class="flex flex-col gap-1.5">
      <Label for="meso-title">Title</Label>
      <Input id="meso-title" placeholder="e.g. Hypertrophy Block" bind:value={title} />
    </div>

    <div class="flex flex-col gap-1.5">
      <div class="flex items-center gap-1.5">
        <Label>Cycle Type</Label>
        <InfoPopover>
          <p>
            <strong>Muscle Gain:</strong> Progressive overload with increasing volume and intensity.
          </p>
          <p class="mt-1">
            <strong>Resensitization:</strong> Maintenance volume (MV) training to recover and re-sensitize
            muscles.
          </p>
          <p class="mt-1">
            <strong>Cut:</strong> Reduced volume while maintaining intensity for fat loss phases.
          </p>
        </InfoPopover>
      </div>
      <Select bind:value={cycleType} type="single">
        <SelectTrigger>{cycleTypeLabel}</SelectTrigger>
        <SelectContent>
          <SelectItem value={CycleType.MuscleGain}
            >{formatCycleType(CycleType.MuscleGain)}</SelectItem
          >
          <SelectItem value={CycleType.Resensitization}
            >{formatCycleType(CycleType.Resensitization)}</SelectItem
          >
          <SelectItem value={CycleType.Cut}>{formatCycleType(CycleType.Cut)}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-3">
      <div class="flex flex-col gap-1.5">
        <Label for="meso-weeks">Weeks</Label>
        <Input id="meso-weeks" type="number" bind:value={weeks} min={2} max={8} />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label for="meso-sessions">Sessions/Week</Label>
        <Input id="meso-sessions" type="number" bind:value={sessionsPerWeek} min={1} max={30} />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label for="meso-days">Days/Cycle</Label>
        <Input id="meso-days" type="number" bind:value={daysPerCycle} min={2} max={30} />
      </div>
    </div>

    <div class="flex flex-col gap-1.5">
      <Label>Rest Days</Label>
      <div class="flex flex-wrap gap-1.5">
        {#each Array.from({ length: daysPerCycle }, (_, index) => index) as dayIndex (dayIndex)}
          <Button
            size="sm"
            variant={restDays.includes(dayIndex) ? 'default' : 'outline'}
            class="w-14"
            onclick={() => toggleRestDay(dayIndex)}
          >
            Day {dayIndex + 1}
          </Button>
        {/each}
      </div>
    </div>
  </CardContent>
</Card>
