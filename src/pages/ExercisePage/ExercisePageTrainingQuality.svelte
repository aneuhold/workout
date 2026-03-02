<!--
  @component

  Training quality section showing SFR (Stimulus to Fatigue Ratio) data from
  the last session exercise, plus the initial fatigue estimate for comparison.
  When no session data exists, shows only the fatigue estimate with a prompt.
-->
<script lang="ts">
  import {
    type Fatigue,
    type WorkoutSessionExercise,
    WorkoutSFRService
  } from '@aneuhold/core-ts-db-lib';
  import InfoPopover from '$components/InfoPopover/InfoPopover.svelte';
  import Progress from '$ui/Progress/Progress.svelte';
  import Separator from '$ui/Separator/Separator.svelte';
  import { cn } from '$util/svelte-shadcn-util';

  let {
    initialFatigueGuess,
    lastSessionExercise
  }: {
    initialFatigueGuess: Fatigue | undefined;
    lastSessionExercise: WorkoutSessionExercise | null;
  } = $props();

  let rsmTotal = $derived(
    lastSessionExercise ? WorkoutSFRService.getRsmTotal(lastSessionExercise.rsm) : null
  );

  let fatigueTotal = $derived(
    lastSessionExercise ? WorkoutSFRService.getFatigueTotal(lastSessionExercise.fatigue) : null
  );

  let sfr = $derived(
    lastSessionExercise
      ? WorkoutSFRService.getSFR(lastSessionExercise.rsm, lastSessionExercise.fatigue)
      : null
  );

  let sfrColorClass = $derived.by(() => {
    if (sfr === null) return 'text-muted-foreground';
    if (sfr >= 1.5) return 'text-green-600 dark:text-green-400';
    if (sfr >= 1.0) return 'text-foreground';
    return 'text-amber-500';
  });

  let estimateTotal = $derived(
    initialFatigueGuess ? WorkoutSFRService.getFatigueTotal(initialFatigueGuess) : null
  );

  let sessionDateStr = $derived(
    lastSessionExercise ? new Date(lastSessionExercise.createdDate).toLocaleDateString() : null
  );
</script>

<div class="flex flex-col gap-3">
  <div class="flex items-center gap-1.5">
    <span class="text-xs text-muted-foreground">Training Quality</span>
    <InfoPopover>
      Training quality metrics from your last session for this exercise. SFR (Stimulus to Fatigue
      Ratio) measures how efficiently your training produces growth stimulus relative to the fatigue
      cost. Higher is better.
    </InfoPopover>
  </div>

  {#if lastSessionExercise}
    <!-- Date source -->
    <span class="text-xs text-muted-foreground">From session on {sessionDateStr}</span>

    <!-- SFR headline -->
    <div class="flex items-baseline gap-2">
      <div class="flex items-center gap-1.5">
        <span class="text-xs text-muted-foreground">SFR</span>
        <InfoPopover>
          <p class="mb-1 font-medium">Stimulus to Fatigue Ratio</p>
          <p>SFR = RSM total / Fatigue total. Indicates training efficiency:</p>
          <ul class="mt-1 flex flex-col gap-0.5">
            <li>
              <span class="text-green-600 dark:text-green-400">1.5+</span> — Excellent efficiency
            </li>
            <li>1.0–1.49 — Adequate efficiency</li>
            <li><span class="text-amber-500">Below 1.0</span> — High cost relative to stimulus</li>
          </ul>
        </InfoPopover>
      </div>
      <span class={cn('text-2xl font-semibold', sfrColorClass)}>
        {sfr !== null ? sfr.toFixed(2) : 'Incomplete'}
      </span>
      {#if rsmTotal !== null && fatigueTotal !== null}
        <span class="text-xs text-muted-foreground">
          (RSM {rsmTotal} / Fatigue {fatigueTotal})
        </span>
      {/if}
    </div>

    <!-- RSM breakdown -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-muted-foreground">RSM</span>
          <InfoPopover>
            <p class="mb-1 font-medium">Raw Stimulus Magnitude</p>
            <p>
              Measures the growth stimulus from this exercise (0–9). Sum of mind-muscle connection,
              pump, and disruption. Higher RSM means more growth signal.
            </p>
          </InfoPopover>
        </div>
        <span class="text-xs text-muted-foreground">{rsmTotal ?? '—'}/9</span>
      </div>
      <Progress value={rsmTotal ?? 0} max={9} />
      <div class="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <span class="text-xs text-muted-foreground">Mind-Muscle</span>
          <p class="font-medium">{lastSessionExercise.rsm?.mindMuscleConnection ?? '—'}</p>
        </div>
        <div>
          <span class="text-xs text-muted-foreground">Pump</span>
          <p class="font-medium">{lastSessionExercise.rsm?.pump ?? '—'}</p>
        </div>
        <div>
          <span class="text-xs text-muted-foreground">Disruption</span>
          <p class="font-medium">{lastSessionExercise.rsm?.disruption ?? '—'}</p>
        </div>
      </div>
    </div>

    <!-- Fatigue breakdown -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-muted-foreground">Fatigue</span>
          <InfoPopover>
            <p class="mb-1 font-medium">Fatigue Score</p>
            <p>
              Measures the recovery cost of this exercise (0–9). Sum of joint/tissue disruption,
              perceived effort, and unused muscle performance impact. Lower fatigue with high RSM is
              ideal.
            </p>
          </InfoPopover>
        </div>
        <span class="text-xs text-muted-foreground">{fatigueTotal ?? '—'}/9</span>
      </div>
      <Progress value={fatigueTotal ?? 0} max={9} />
      <div class="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <span class="text-xs text-muted-foreground">Joint</span>
          <p class="font-medium">
            {lastSessionExercise.fatigue?.jointAndTissueDisruption ?? '—'}
          </p>
        </div>
        <div>
          <span class="text-xs text-muted-foreground">Effort</span>
          <p class="font-medium">{lastSessionExercise.fatigue?.perceivedEffort ?? '—'}</p>
        </div>
        <div>
          <span class="text-xs text-muted-foreground">Unused</span>
          <p class="font-medium">
            {lastSessionExercise.fatigue?.unusedMusclePerformance ?? '—'}
          </p>
        </div>
      </div>
    </div>

    <!-- Recovery -->
    <div class="flex gap-6 text-sm">
      <div class="flex items-center gap-1.5">
        <div>
          <span class="text-xs text-muted-foreground">Soreness</span>
          <p class="font-medium">{lastSessionExercise.sorenessScore ?? '—'}/3</p>
        </div>
        <InfoPopover>
          <p class="mb-1 font-medium">Soreness Score (0–3)</p>
          <ul class="flex flex-col gap-0.5">
            <li><strong>0:</strong> No soreness in target muscle</li>
            <li><strong>1:</strong> Mild stiffness, resolved before next session</li>
            <li><strong>2:</strong> DOMS that resolved just in time for next session</li>
            <li><strong>3:</strong> DOMS still present at next session</li>
          </ul>
        </InfoPopover>
      </div>
      <div class="flex items-center gap-1.5">
        <div>
          <span class="text-xs text-muted-foreground">Performance</span>
          <p class="font-medium">{lastSessionExercise.performanceScore ?? '—'}/3</p>
        </div>
        <InfoPopover>
          <p class="mb-1 font-medium">Performance Score (0–3)</p>
          <ul class="flex flex-col gap-0.5">
            <li><strong>0:</strong> Hit target reps with 2+ reps extra needed or surplus</li>
            <li><strong>1:</strong> Hit target reps with 0–1 rep variance</li>
            <li><strong>2:</strong> Hit target reps after target RIR</li>
            <li><strong>3:</strong> Could not match last week's reps at any RIR</li>
          </ul>
        </InfoPopover>
      </div>
    </div>

    <!-- Initial fatigue estimate comparison -->
    {#if initialFatigueGuess}
      <Separator />
      <div class="text-muted-foreground">
        <div class="flex items-center gap-1.5">
          <span class="text-xs">Initial Fatigue Estimate</span>
          <span class="text-xs">{estimateTotal}/9</span>
        </div>
        <div class="mt-1 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <span class="text-xs">Joint</span>
            <p>{initialFatigueGuess.jointAndTissueDisruption ?? '—'}</p>
          </div>
          <div>
            <span class="text-xs">Effort</span>
            <p>{initialFatigueGuess.perceivedEffort ?? '—'}</p>
          </div>
          <div>
            <span class="text-xs">Unused</span>
            <p>{initialFatigueGuess.unusedMusclePerformance ?? '—'}</p>
          </div>
        </div>
      </div>
    {/if}
  {:else}
    <!-- No session data — show fatigue estimate only -->
    {#if initialFatigueGuess}
      <div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted-foreground">Fatigue Estimate</span>
          <span class="text-xs text-muted-foreground">{estimateTotal}/9</span>
        </div>
        <div class="mt-1 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <span class="text-xs text-muted-foreground">Joint</span>
            <p class="font-medium">{initialFatigueGuess.jointAndTissueDisruption ?? '—'}</p>
          </div>
          <div>
            <span class="text-xs text-muted-foreground">Effort</span>
            <p class="font-medium">{initialFatigueGuess.perceivedEffort ?? '—'}</p>
          </div>
          <div>
            <span class="text-xs text-muted-foreground">Unused</span>
            <p class="font-medium">{initialFatigueGuess.unusedMusclePerformance ?? '—'}</p>
          </div>
        </div>
      </div>
    {/if}

    <p class="text-xs text-muted-foreground">
      Perform a session with this exercise to see actual training quality data.
    </p>
  {/if}
</div>
