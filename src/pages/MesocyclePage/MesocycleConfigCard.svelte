<!--
  @component

  Configuration card for a mesocycle.
  Handles title, cycle type, numeric config, rest day selection, and start date
  overlap prevention. Supports a `disabled` mode where only the title remains
  editable (date logic is skipped).
-->
<script lang="ts">
  import { CycleType, WorkoutMesocycleService } from '@aneuhold/core-ts-db-lib';
  import { DateService } from '@aneuhold/core-ts-lib';
  import { type DateValue, fromDate, getLocalTimeZone } from '@internationalized/date';
  import { IconAlertTriangle } from '@tabler/icons-svelte';
  import { IconCalendar } from '@tabler/icons-svelte';
  import type { UUID } from 'crypto';
  import InfoPopover from '$components/InfoPopover/InfoPopover.svelte';
  import ValidatedInput from '$components/ValidatedInput/ValidatedInput.svelte';
  import { formatCycleType } from '$pages/MesocyclesPage/mesocyclesPageUtils';
  import mesocycleMapService from '$services/documentMapServices/mesocycleMapService.svelte';
  import microcycleMapService from '$services/documentMapServices/microcycleMapService.svelte';
  import Alert from '$ui/Alert/Alert.svelte';
  import AlertDescription from '$ui/Alert/AlertDescription.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Calendar from '$ui/Calendar/Calendar.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import Label from '$ui/Label/Label.svelte';
  import Popover from '$ui/Popover/Popover.svelte';
  import PopoverContent from '$ui/Popover/PopoverContent.svelte';
  import PopoverTrigger from '$ui/Popover/PopoverTrigger.svelte';
  import Select from '$ui/Select/Select.svelte';
  import SelectContent from '$ui/Select/SelectContent.svelte';
  import SelectItem from '$ui/Select/SelectItem.svelte';
  import SelectTrigger from '$ui/Select/SelectTrigger.svelte';

  let {
    title = $bindable(''),
    startDate = $bindable(new Date()),
    cycleType = $bindable<CycleType>(CycleType.MuscleGain),
    weeks = $bindable(6),
    sessionsPerWeek = $bindable(5),
    daysPerCycle = $bindable(7),
    restDays = $bindable<number[]>([0, 6]),
    overlapWarning = $bindable<string | null>(null),
    disabled = false,
    editingMesocycleId,
    onTitleBlur
  }: {
    title: string;
    startDate: Date;
    cycleType: CycleType;
    weeks: number;
    sessionsPerWeek: number;
    daysPerCycle: number;
    restDays: number[];
    overlapWarning?: string | null;
    disabled?: boolean;
    editingMesocycleId?: UUID;
    onTitleBlur?: () => void;
  } = $props();

  const tz = getLocalTimeZone();
  let calendarValue = $state<DateValue | undefined>(fromDate(startDate, tz));
  let popoverOpen = $state(false);

  // Sync calendar value back to the Date prop
  $effect(() => {
    if (calendarValue) {
      startDate = calendarValue.toDate(tz);
    }
  });

  const formattedDate = $derived(
    startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  );

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

  const cycleTypeHints: Partial<Record<CycleType, string>> = {
    [CycleType.Resensitization]:
      'Heavy rep range exercises are recommended for resensitization to preserve strength with lower volume.',
    [CycleType.Cut]:
      'Volume progression will be slower during a cut. Focus on maintaining intensity while managing recovery.'
  };

  const cycleTypeHint = $derived(cycleTypeHints[cycleType] ?? null);

  // --- Date overlap logic (form mode only) ---

  const allMesocycles = $derived(disabled ? [] : mesocycleMapService.allDocs);

  /**
   * Returns true if the given date falls within an existing mesocycle's date range,
   * or if the date is before today. Used to disable overlapping dates in the Calendar.
   *
   * @param date The calendar date to check for disabling.
   */
  function disabledDateMatcher(date: Date): boolean {
    const todayStart = new Date(new Date().toDateString());
    if (date.getTime() < todayStart.getTime()) return true;

    for (const m of allMesocycles) {
      if (m._id === editingMesocycleId) continue;
      if (m.completedDate != null) continue;
      const mesoMicrocycles = microcycleMapService.getOrderedMicrocyclesForMesocycle(m._id);
      const endDate = WorkoutMesocycleService.getProjectedEndDate(m, mesoMicrocycles);
      const mesoStart = WorkoutMesocycleService.getProjectedStartDate(m, mesoMicrocycles);
      if (mesoStart == null || endDate == null) continue;
      if (date.getTime() >= mesoStart.getTime() && date.getTime() < endDate.getTime()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Helper text below date picker when start date follows another mesocycle.
   * Only shown for new mesocycles (editingMesocycleId is undefined).
   */
  const startDateHelperText = $derived.by(() => {
    if (disabled || editingMesocycleId) return null;
    const otherMesocycles = allMesocycles.filter((m) => m.completedDate == null);
    if (otherMesocycles.length === 0) return null;

    let latestMesocycle = otherMesocycles[0];
    let latestEnd = WorkoutMesocycleService.getProjectedEndDate(
      latestMesocycle,
      microcycleMapService.getOrderedMicrocyclesForMesocycle(latestMesocycle._id)
    );

    for (const m of otherMesocycles) {
      const mesoMicrocycles = microcycleMapService.getOrderedMicrocyclesForMesocycle(m._id);
      const end = WorkoutMesocycleService.getProjectedEndDate(m, mesoMicrocycles);
      if (end != null && (latestEnd == null || end.getTime() > latestEnd.getTime())) {
        latestEnd = end;
        latestMesocycle = m;
      }
    }

    if (latestEnd != null && startDate.getTime() >= latestEnd.getTime()) {
      return `Starts after ${latestMesocycle.title ?? 'previous mesocycle'} ends`;
    }
    return null;
  });

  /**
   * Converts the disabledDateMatcher to a DateValue-based function for the
   * bits-ui Calendar isDateDisabled prop.
   *
   * @param dateValue The calendar date value to check for disabling.
   */
  const isDateDisabled = $derived(
    disabled
      ? undefined
      : (dateValue: DateValue) => {
          const jsDate = dateValue.toDate(tz);
          return disabledDateMatcher(jsDate);
        }
  );

  const computedOverlapWarning = $derived.by<string | null>(() => {
    if (disabled) return null;

    const candidates = allMesocycles.filter(
      (m) => m._id !== editingMesocycleId && m.completedDate == null
    );
    if (candidates.length === 0) return null;

    const previewEnd = DateService.addDays(startDate, weeks * daysPerCycle);

    for (const m of candidates) {
      const mesoMicrocycles = microcycleMapService.getOrderedMicrocyclesForMesocycle(m._id);
      const mStart = WorkoutMesocycleService.getProjectedStartDate(m, mesoMicrocycles);
      const mEnd = WorkoutMesocycleService.getProjectedEndDate(m, mesoMicrocycles);
      if (!mStart || !mEnd) continue;

      // Two date ranges overlap when each starts before the other ends
      if (startDate.getTime() < mEnd.getTime() && previewEnd.getTime() > mStart.getTime()) {
        const startStr = mStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = mEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `This configuration would overlap with ${m.title ?? 'another mesocycle'} (${startStr} \u2013 ${endStr})`;
      }
    }
    return null;
  });

  $effect(() => {
    // So that we can tell the parent form about overlaps without needing to house the logic there.
    // This is probably a code-smell though, and should be refactored so there is a unified service
    // somewhere that houses the overlap state.
    overlapWarning = computedOverlapWarning;
  });
</script>

<Card>
  <CardHeader>
    <CardTitle>Configuration</CardTitle>
  </CardHeader>
  <CardContent class="flex flex-col gap-4">
    <div class="flex flex-col gap-1.5" onfocusout={onTitleBlur}>
      <Label for="meso-title">Title *</Label>
      <ValidatedInput
        id="meso-title"
        required
        placeholder="e.g. Hypertrophy Block"
        bind:value={title}
      />
    </div>

    <div class="flex flex-col items-start gap-1.5">
      <Label>Start Date</Label>
      <Popover bind:open={popoverOpen}>
        <PopoverTrigger>
          <Button variant="outline" {disabled} data-testid="start-date-trigger">
            <IconCalendar size={16} />
            {formattedDate}
          </Button>
        </PopoverTrigger>
        <PopoverContent class="p-0">
          <Calendar
            type="single"
            bind:value={calendarValue}
            {isDateDisabled}
            onValueChange={() => {
              popoverOpen = false;
            }}
          />
        </PopoverContent>
      </Popover>
      {#if startDateHelperText}
        <span class="text-xs text-muted-foreground">{startDateHelperText}</span>
      {/if}
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
      <Select bind:value={cycleType} type="single" {disabled}>
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
      {#if cycleTypeHint}
        <span class="text-xs text-muted-foreground">{cycleTypeHint}</span>
      {/if}
    </div>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-3">
      <div class="flex flex-col gap-1.5">
        <Label for="meso-weeks">Weeks</Label>
        <ValidatedInput
          id="meso-weeks"
          type="number"
          bind:value={weeks}
          min={2}
          max={8}
          {disabled}
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label for="meso-sessions">Sessions/Microcycle</Label>
        <ValidatedInput
          id="meso-sessions"
          type="number"
          bind:value={sessionsPerWeek}
          min={1}
          max={30}
          {disabled}
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label for="meso-days">Days/Cycle</Label>
        <ValidatedInput
          id="meso-days"
          type="number"
          bind:value={daysPerCycle}
          min={2}
          max={30}
          {disabled}
        />
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
            {disabled}
          >
            Day {dayIndex + 1}
          </Button>
        {/each}
      </div>
    </div>

    {#if overlapWarning}
      <Alert variant="warn">
        <IconAlertTriangle size={16} />
        <AlertDescription>{overlapWarning}</AlertDescription>
      </Alert>
    {/if}
  </CardContent>
</Card>
