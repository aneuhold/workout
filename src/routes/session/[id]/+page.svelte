<!--
  @component

  Session logging page. Displays all exercises for a session in one scrollable
  view with set tracking, RSM/fatigue/soreness/performance sliders, and a
  progress bar. Current set has a heartbeat animation.
-->
<script lang="ts">
  import {
    IconCheck,
    IconChevronDown,
    IconChevronUp,
    IconClock,
    IconInfoCircle
  } from '@tabler/icons-svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import Input from '$ui/Input/Input.svelte';
  import Label from '$ui/Label/Label.svelte';
  import Popover from '$ui/Popover/Popover.svelte';
  import PopoverContent from '$ui/Popover/PopoverContent.svelte';
  import PopoverTrigger from '$ui/Popover/PopoverTrigger.svelte';
  import Progress from '$ui/Progress/Progress.svelte';
  import Separator from '$ui/Separator/Separator.svelte';
  import Slider from '$ui/Slider/Slider.svelte';

  type SessionExercise = {
    id: string;
    name: string;
    equipment: string;
    repRange: string;
    restSeconds: number;
    muscleGroups: string[];
    sets: {
      id: string;
      plannedWeight: number;
      plannedReps: number;
      plannedRir: number;
      actualWeight: number | undefined;
      actualReps: number | undefined;
      rir: number | undefined;
      completed: boolean;
    }[];
    rsm: {
      mindMuscleConnection: number | undefined;
      pump: number | undefined;
      disruption: number | undefined;
    };
    fatigue: {
      jointAndTissueDisruption: number | undefined;
      perceivedEffort: number | undefined;
      unusedMusclePerformance: number | undefined;
    };
    sorenessScore: number | undefined;
    performanceScore: number | undefined;
  };

  // Fake session data
  const session: { id: string; title: string; description: string; exercises: SessionExercise[] } =
    {
      id: 'demo',
      title: 'Push Day A',
      description: 'Week 3 - Accumulation Phase',
      exercises: [
        {
          id: 'ex-1',
          name: 'Barbell Bench Press',
          equipment: 'Barbell',
          repRange: 'Heavy',
          restSeconds: 120,
          muscleGroups: ['Chest', 'Triceps', 'Front Delts'],
          sets: [
            {
              id: 's1',
              plannedWeight: 185,
              plannedReps: 9,
              plannedRir: 2,
              actualWeight: 185,
              actualReps: 9,
              rir: 2,
              completed: true
            },
            {
              id: 's2',
              plannedWeight: 185,
              plannedReps: 9,
              plannedRir: 2,
              actualWeight: 185,
              actualReps: 8,
              rir: 2,
              completed: true
            },
            {
              id: 's3',
              plannedWeight: 185,
              plannedReps: 9,
              plannedRir: 2,
              actualWeight: undefined,
              actualReps: undefined,
              rir: undefined,
              completed: false
            }
          ],
          rsm: { mindMuscleConnection: undefined, pump: undefined, disruption: undefined },
          fatigue: {
            jointAndTissueDisruption: undefined,
            perceivedEffort: undefined,
            unusedMusclePerformance: undefined
          },
          sorenessScore: undefined,
          performanceScore: undefined
        },
        {
          id: 'ex-2',
          name: 'Incline DB Press',
          equipment: 'Dumbbells',
          repRange: 'Medium',
          restSeconds: 90,
          muscleGroups: ['Upper Chest', 'Triceps'],
          sets: [
            {
              id: 's4',
              plannedWeight: 60,
              plannedReps: 13,
              plannedRir: 2,
              actualWeight: undefined,
              actualReps: undefined,
              rir: undefined,
              completed: false
            },
            {
              id: 's5',
              plannedWeight: 60,
              plannedReps: 13,
              plannedRir: 2,
              actualWeight: undefined,
              actualReps: undefined,
              rir: undefined,
              completed: false
            },
            {
              id: 's6',
              plannedWeight: 60,
              plannedReps: 13,
              plannedRir: 2,
              actualWeight: undefined,
              actualReps: undefined,
              rir: undefined,
              completed: false
            }
          ],
          rsm: { mindMuscleConnection: undefined, pump: undefined, disruption: undefined },
          fatigue: {
            jointAndTissueDisruption: undefined,
            perceivedEffort: undefined,
            unusedMusclePerformance: undefined
          },
          sorenessScore: undefined,
          performanceScore: undefined
        },
        {
          id: 'ex-3',
          name: 'Cable Fly',
          equipment: 'Cable',
          repRange: 'Medium',
          restSeconds: 60,
          muscleGroups: ['Chest'],
          sets: [
            {
              id: 's7',
              plannedWeight: 30,
              plannedReps: 16,
              plannedRir: 2,
              actualWeight: undefined,
              actualReps: undefined,
              rir: undefined,
              completed: false
            },
            {
              id: 's8',
              plannedWeight: 30,
              plannedReps: 16,
              plannedRir: 2,
              actualWeight: undefined,
              actualReps: undefined,
              rir: undefined,
              completed: false
            },
            {
              id: 's9',
              plannedWeight: 30,
              plannedReps: 16,
              plannedRir: 2,
              actualWeight: undefined,
              actualReps: undefined,
              rir: undefined,
              completed: false
            }
          ],
          rsm: { mindMuscleConnection: undefined, pump: undefined, disruption: undefined },
          fatigue: {
            jointAndTissueDisruption: undefined,
            perceivedEffort: undefined,
            unusedMusclePerformance: undefined
          },
          sorenessScore: undefined,
          performanceScore: undefined
        },
        {
          id: 'ex-4',
          name: 'Lateral Raise',
          equipment: 'Dumbbells',
          repRange: 'Light',
          restSeconds: 60,
          muscleGroups: ['Side Delts'],
          sets: [
            {
              id: 's10',
              plannedWeight: 15,
              plannedReps: 20,
              plannedRir: 2,
              actualWeight: undefined,
              actualReps: undefined,
              rir: undefined,
              completed: false
            },
            {
              id: 's11',
              plannedWeight: 15,
              plannedReps: 20,
              plannedRir: 2,
              actualWeight: undefined,
              actualReps: undefined,
              rir: undefined,
              completed: false
            },
            {
              id: 's12',
              plannedWeight: 15,
              plannedReps: 20,
              plannedRir: 2,
              actualWeight: undefined,
              actualReps: undefined,
              rir: undefined,
              completed: false
            }
          ],
          rsm: { mindMuscleConnection: undefined, pump: undefined, disruption: undefined },
          fatigue: {
            jointAndTissueDisruption: undefined,
            perceivedEffort: undefined,
            unusedMusclePerformance: undefined
          },
          sorenessScore: undefined,
          performanceScore: undefined
        },
        {
          id: 'ex-5',
          name: 'Tricep Pushdown',
          equipment: 'Cable',
          repRange: 'Medium',
          restSeconds: 60,
          muscleGroups: ['Triceps'],
          sets: [
            {
              id: 's13',
              plannedWeight: 50,
              plannedReps: 14,
              plannedRir: 2,
              actualWeight: undefined,
              actualReps: undefined,
              rir: undefined,
              completed: false
            },
            {
              id: 's14',
              plannedWeight: 50,
              plannedReps: 14,
              plannedRir: 2,
              actualWeight: undefined,
              actualReps: undefined,
              rir: undefined,
              completed: false
            }
          ],
          rsm: { mindMuscleConnection: undefined, pump: undefined, disruption: undefined },
          fatigue: {
            jointAndTissueDisruption: undefined,
            perceivedEffort: undefined,
            unusedMusclePerformance: undefined
          },
          sorenessScore: undefined,
          performanceScore: undefined
        }
      ]
    };

  // Calculate totals
  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  let completedSets = $state(
    session.exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0)
  );

  // Find current exercise and set
  const findCurrent = () => {
    for (let exIdx = 0; exIdx < session.exercises.length; exIdx++) {
      const exercise = session.exercises[exIdx];
      for (let setIdx = 0; setIdx < exercise.sets.length; setIdx++) {
        if (!exercise.sets[setIdx].completed) {
          return { exerciseIndex: exIdx, setIndex: setIdx };
        }
      }
    }
    return null;
  };

  let current = $state(findCurrent());

  // Slider label maps
  const sliderLabels: Record<string, string[]> = {
    mindMuscleConnection: [
      'Not Set',
      '0 - Barely aware',
      '1 - Mild',
      '2 - Good tension',
      '3 - Near limit'
    ],
    pump: ['Not Set', '0 - No pump', '1 - Very mild', '2 - Decent', '3 - Near maximal'],
    disruption: [
      'Not Set',
      '0 - No fatigue',
      '1 - Some, resolved next day',
      '2 - DOMS next day',
      '3 - DOMS for days'
    ],
    jointAndTissueDisruption: [
      'Not Set',
      '0 - Minimal pain',
      '1 - Some, resolved next day',
      '2 - Persistent',
      '3 - Chronic pain'
    ],
    perceivedEffort: [
      'Not Set',
      '0 - Very easy',
      '1 - Recovered by EOD',
      '2 - Drained next day',
      '3 - Drained for days'
    ],
    unusedMusclePerformance: [
      'Not Set',
      '0 - Better than expected',
      '1 - As expected',
      '2 - Worse',
      '3 - Hugely deteriorated'
    ],
    sorenessScore: [
      'Not Set',
      '0 - Not sore',
      '1 - Stiff, mild',
      '2 - DOMS, resolved in time',
      '3 - DOMS remained'
    ],
    performanceScore: [
      'Not Set',
      '0 - Off by 2+ RIR',
      '1 - Off by 0-1 RIR',
      '2 - Hit target',
      "3 - Couldn't match"
    ]
  };

  /**
   * Gets a color class based on slider value and whether higher is better or worse.
   *
   * @param value - the numeric score (0-3) or undefined
   * @param type - the scoring direction
   */
  const getSliderColor = (
    value: number | undefined,
    type: 'positive' | 'negative' | 'performance'
  ): string => {
    if (value === undefined || value < 0) return 'text-muted-foreground';
    if (type === 'positive') {
      const colors = [
        'text-muted-foreground',
        'text-yellow-500',
        'text-green-400',
        'text-green-500'
      ];
      return colors[value] ?? 'text-muted-foreground';
    }
    if (type === 'negative') {
      const colors = ['text-green-500', 'text-yellow-500', 'text-orange-500', 'text-red-500'];
      return colors[value] ?? 'text-muted-foreground';
    }
    // Performance: 2 is best, 3 is worst
    const colors = ['text-yellow-500', 'text-green-400', 'text-green-500', 'text-red-500'];
    return colors[value] ?? 'text-muted-foreground';
  };

  /**
   * Converts a slider value (0-4) to a score value (undefined for Not Set,
   * 0-3 for the rest).
   *
   * @param sliderValue - the slider position (0=Not Set, 1-4 map to 0-3)
   */
  const sliderToScore = (sliderValue: number): number | undefined => {
    if (sliderValue === 0) return undefined;
    return sliderValue - 1;
  };

  /**
   * Converts a score value (undefined or 0-3) to a slider value (0-4).
   *
   * @param score - the score value (undefined or 0-3)
   */
  const scoreToSlider = (score: number | undefined): number => {
    if (score === undefined) return 0;
    return score + 1;
  };

  // Collapsed state for exercises (all start expanded)
  let collapsedExercises = $state<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    collapsedExercises[id] = !collapsedExercises[id];
  };

  const repRangeColor: Record<string, string> = {
    Heavy: 'bg-red-500/10 text-red-500',
    Medium: 'bg-yellow-500/10 text-yellow-500',
    Light: 'bg-green-500/10 text-green-500'
  };
</script>

<svelte:head>
  <style>
    @keyframes heartbeat {
      0%,
      100% {
        transform: scale(1);
      }
      15% {
        transform: scale(1.04);
      }
      30% {
        transform: scale(1);
      }
      45% {
        transform: scale(1.02);
      }
    }
    .heartbeat {
      animation: heartbeat 2s ease-in-out infinite;
    }
  </style>
</svelte:head>

<div class="mx-auto max-w-lg space-y-3 p-4">
  <!-- Session header + progress -->
  <div>
    <h1 class="text-lg font-semibold">{session.title}</h1>
    <p class="text-muted-foreground text-sm">{session.description}</p>
  </div>
  <div class="flex items-center gap-3">
    <Progress value={(completedSets / totalSets) * 100} max={100} class="h-2 flex-1" />
    <span class="text-muted-foreground shrink-0 text-xs font-medium">
      {completedSets}/{totalSets} sets
    </span>
  </div>

  <!-- Exercises list -->
  {#each session.exercises as exercise, exIdx (exercise.id)}
    {@const isCurrent = current?.exerciseIndex === exIdx}
    {@const isCollapsed = collapsedExercises[exercise.id]}
    {@const allComplete = exercise.sets.every((s) => s.completed)}

    <Card class={isCurrent ? 'heartbeat ring-primary/30 ring-2' : allComplete ? 'opacity-75' : ''}>
      <!-- Exercise header (always visible, tappable to collapse) -->
      <button class="w-full text-left" onclick={() => toggleCollapse(exercise.id)}>
        <CardHeader>
          <div class="flex items-center gap-2">
            {#if allComplete}
              <div class="bg-green-500/10 flex size-6 items-center justify-center rounded-full">
                <IconCheck size={14} class="text-green-500" />
              </div>
            {:else if isCurrent}
              <div class="bg-primary/10 flex size-6 items-center justify-center rounded-full">
                <span class="bg-primary size-2 animate-pulse rounded-full"></span>
              </div>
            {/if}
            <CardTitle class="flex-1">{exercise.name}</CardTitle>
            {#if isCollapsed}
              <IconChevronDown size={16} class="text-muted-foreground" />
            {:else}
              <IconChevronUp size={16} class="text-muted-foreground" />
            {/if}
          </div>
          <div class="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="outline" class={repRangeColor[exercise.repRange]}>
              {exercise.repRange}
            </Badge>
            <Badge variant="outline">{exercise.equipment}</Badge>
            {#each exercise.muscleGroups as mg (mg)}
              <Badge variant="secondary">{mg}</Badge>
            {/each}
          </div>
        </CardHeader>
      </button>

      {#if !isCollapsed}
        <CardContent class="space-y-4">
          <!-- Sets table -->
          <div class="space-y-2">
            <!-- Set header row -->
            <div class="text-muted-foreground grid grid-cols-12 gap-2 px-1 text-xs font-medium">
              <span class="col-span-1">Set</span>
              <span class="col-span-3 text-center">Weight</span>
              <span class="col-span-3 text-center">Reps</span>
              <span class="col-span-2 text-center">RIR</span>
              <span class="col-span-3 text-center"></span>
            </div>

            {#each exercise.sets as set, setIdx (set.id)}
              {@const isCurrentSet = isCurrent && current?.setIndex === setIdx}
              <div
                class={`grid grid-cols-12 items-center gap-2 rounded-lg p-1.5 ${
                  isCurrentSet
                    ? 'bg-primary/5 ring-primary/20 ring-1'
                    : set.completed
                      ? 'bg-muted/50'
                      : ''
                }`}
              >
                <span
                  class={`col-span-1 text-center text-xs font-medium ${
                    set.completed
                      ? 'text-green-500'
                      : isCurrentSet
                        ? 'text-primary'
                        : 'text-muted-foreground'
                  }`}
                >
                  {setIdx + 1}
                </span>
                <div class="col-span-3">
                  <Input
                    type="number"
                    value={set.actualWeight ?? set.plannedWeight}
                    placeholder={String(set.plannedWeight)}
                    class="h-8 text-center text-sm"
                    disabled={set.completed}
                  />
                </div>
                <div class="col-span-3">
                  <Input
                    type="number"
                    value={set.actualReps ?? set.plannedReps}
                    placeholder={String(set.plannedReps)}
                    class="h-8 text-center text-sm"
                    disabled={set.completed}
                  />
                </div>
                <div class="col-span-2">
                  <Input
                    type="number"
                    value={set.rir ?? set.plannedRir}
                    placeholder={String(set.plannedRir)}
                    class="h-8 text-center text-sm"
                    disabled={set.completed}
                  />
                </div>
                <div class="col-span-3 flex items-center justify-end gap-1">
                  {#if set.completed}
                    <Badge variant="outline" class="border-green-500/30 text-green-500">
                      <IconCheck size={12} />
                      Done
                    </Badge>
                  {:else if isCurrentSet}
                    <Button
                      size="xs"
                      onclick={() => {
                        set.completed = true;
                        completedSets++;
                        current = findCurrent();
                      }}
                    >
                      Log
                    </Button>
                    <Button variant="outline" size="icon-xs">
                      <IconClock size={14} />
                    </Button>
                  {:else}
                    <span class="text-muted-foreground text-xs">
                      {set.plannedWeight}lb x{set.plannedReps} @{set.plannedRir}RIR
                    </span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>

          <Separator />

          <!-- RSM Sliders -->
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium">Stimulus (RSM)</p>
              <Popover>
                <PopoverTrigger>
                  <IconInfoCircle size={14} class="text-muted-foreground" />
                </PopoverTrigger>
                <PopoverContent class="text-xs">
                  <p class="mb-1 font-medium">Raw Stimulus Magnitude</p>
                  <p>
                    Rate how much growth stimulus this exercise produced. Higher values indicate
                    more effective training for this muscle group.
                  </p>
                </PopoverContent>
              </Popover>
            </div>

            <!-- Mind-Muscle Connection -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Mind-Muscle Connection</Label>
                <span
                  class={`text-xs font-medium ${getSliderColor(sliderToScore(scoreToSlider(exercise.rsm.mindMuscleConnection)), 'positive')}`}
                >
                  {sliderLabels.mindMuscleConnection[
                    scoreToSlider(exercise.rsm.mindMuscleConnection)
                  ]}
                </span>
              </div>
              <Slider
                type="single"
                value={scoreToSlider(exercise.rsm.mindMuscleConnection)}
                min={0}
                max={4}
                step={1}
                onValueChange={(v: number) => {
                  exercise.rsm.mindMuscleConnection = sliderToScore(v);
                }}
              />
            </div>

            <!-- Pump -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Pump</Label>
                <span
                  class={`text-xs font-medium ${getSliderColor(sliderToScore(scoreToSlider(exercise.rsm.pump)), 'positive')}`}
                >
                  {sliderLabels.pump[scoreToSlider(exercise.rsm.pump)]}
                </span>
              </div>
              <Slider
                type="single"
                value={scoreToSlider(exercise.rsm.pump)}
                min={0}
                max={4}
                step={1}
                onValueChange={(v: number) => {
                  exercise.rsm.pump = sliderToScore(v);
                }}
              />
            </div>

            <!-- Disruption -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Disruption</Label>
                <span
                  class={`text-xs font-medium ${getSliderColor(sliderToScore(scoreToSlider(exercise.rsm.disruption)), 'positive')}`}
                >
                  {sliderLabels.disruption[scoreToSlider(exercise.rsm.disruption)]}
                </span>
              </div>
              <Slider
                type="single"
                value={scoreToSlider(exercise.rsm.disruption)}
                min={0}
                max={4}
                step={1}
                onValueChange={(v: number) => {
                  exercise.rsm.disruption = sliderToScore(v);
                }}
              />
            </div>
          </div>

          <Separator />

          <!-- Fatigue Sliders -->
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium">Fatigue</p>
              <Popover>
                <PopoverTrigger>
                  <IconInfoCircle size={14} class="text-muted-foreground" />
                </PopoverTrigger>
                <PopoverContent class="text-xs">
                  <p class="mb-1 font-medium">Fatigue Estimation</p>
                  <p>
                    Rate the fatigue this exercise generated. Lower fatigue with high stimulus means
                    better SFR (Stimulus to Fatigue Ratio).
                  </p>
                </PopoverContent>
              </Popover>
            </div>

            <!-- Joint & Tissue Disruption -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Joint & Tissue</Label>
                <span
                  class={`text-xs font-medium ${getSliderColor(sliderToScore(scoreToSlider(exercise.fatigue.jointAndTissueDisruption)), 'negative')}`}
                >
                  {sliderLabels.jointAndTissueDisruption[
                    scoreToSlider(exercise.fatigue.jointAndTissueDisruption)
                  ]}
                </span>
              </div>
              <Slider
                type="single"
                value={scoreToSlider(exercise.fatigue.jointAndTissueDisruption)}
                min={0}
                max={4}
                step={1}
                onValueChange={(v: number) => {
                  exercise.fatigue.jointAndTissueDisruption = sliderToScore(v);
                }}
              />
            </div>

            <!-- Perceived Effort -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Perceived Effort</Label>
                <span
                  class={`text-xs font-medium ${getSliderColor(sliderToScore(scoreToSlider(exercise.fatigue.perceivedEffort)), 'negative')}`}
                >
                  {sliderLabels.perceivedEffort[scoreToSlider(exercise.fatigue.perceivedEffort)]}
                </span>
              </div>
              <Slider
                type="single"
                value={scoreToSlider(exercise.fatigue.perceivedEffort)}
                min={0}
                max={4}
                step={1}
                onValueChange={(v: number) => {
                  exercise.fatigue.perceivedEffort = sliderToScore(v);
                }}
              />
            </div>

            <!-- Unused Muscle Performance -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Unused Muscle Perf.</Label>
                <span
                  class={`text-xs font-medium ${getSliderColor(sliderToScore(scoreToSlider(exercise.fatigue.unusedMusclePerformance)), 'negative')}`}
                >
                  {sliderLabels.unusedMusclePerformance[
                    scoreToSlider(exercise.fatigue.unusedMusclePerformance)
                  ]}
                </span>
              </div>
              <Slider
                type="single"
                value={scoreToSlider(exercise.fatigue.unusedMusclePerformance)}
                min={0}
                max={4}
                step={1}
                onValueChange={(v: number) => {
                  exercise.fatigue.unusedMusclePerformance = sliderToScore(v);
                }}
              />
            </div>
          </div>

          <Separator />

          <!-- Soreness & Performance -->
          <div class="space-y-3">
            <p class="text-sm font-medium">Recovery Indicators</p>

            <!-- Soreness -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Soreness</Label>
                <span
                  class={`text-xs font-medium ${getSliderColor(sliderToScore(scoreToSlider(exercise.sorenessScore)), 'negative')}`}
                >
                  {sliderLabels.sorenessScore[scoreToSlider(exercise.sorenessScore)]}
                </span>
              </div>
              <Slider
                type="single"
                value={scoreToSlider(exercise.sorenessScore)}
                min={0}
                max={4}
                step={1}
                onValueChange={(v: number) => {
                  exercise.sorenessScore = sliderToScore(v);
                }}
              />
            </div>

            <!-- Performance -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Performance</Label>
                <span
                  class={`text-xs font-medium ${getSliderColor(sliderToScore(scoreToSlider(exercise.performanceScore)), 'performance')}`}
                >
                  {sliderLabels.performanceScore[scoreToSlider(exercise.performanceScore)]}
                </span>
              </div>
              <Slider
                type="single"
                value={scoreToSlider(exercise.performanceScore)}
                min={0}
                max={4}
                step={1}
                onValueChange={(v: number) => {
                  exercise.performanceScore = sliderToScore(v);
                }}
              />
            </div>
          </div>
        </CardContent>
      {/if}
    </Card>
  {/each}

  <!-- Session-level RSM & Fatigue (overall) -->
  <Card>
    <CardHeader>
      <CardTitle>Session Summary</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <div class="grid grid-cols-2 gap-4 text-center">
        <div>
          <p class="text-muted-foreground text-xs">Sets Completed</p>
          <p class="text-2xl font-semibold">{completedSets}/{totalSets}</p>
        </div>
        <div>
          <p class="text-muted-foreground text-xs">Progress</p>
          <p class="text-2xl font-semibold">{Math.round((completedSets / totalSets) * 100)}%</p>
        </div>
      </div>
      <Button class="w-full" size="lg" disabled={completedSets < totalSets}>
        Complete Session
      </Button>
    </CardContent>
  </Card>
</div>
