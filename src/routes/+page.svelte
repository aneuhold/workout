<!--
  @component

  Home dashboard page. Shows CTAs for logging sessions, pending logs, and
  recent session history.
-->
<script lang="ts">
  import {
    IconAlertCircle,
    IconBarbell,
    IconCalendarEvent,
    IconChevronRight,
    IconPlayerPlay,
    IconTrendingUp
  } from '@tabler/icons-svelte';
  import Badge from '$ui/Badge/Badge.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardDescription from '$ui/Card/CardDescription.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import Progress from '$ui/Progress/Progress.svelte';
  import Separator from '$ui/Separator/Separator.svelte';

  // Fake data
  const currentMesocycle = {
    title: 'Upper/Lower Hypertrophy',
    cycleType: 'MuscleGain',
    week: 3,
    totalWeeks: 5
  };

  const nextSession = {
    id: 'demo',
    title: 'Push Day A',
    description: '5 exercises, ~45 min estimated',
    exercises: [
      'Barbell Bench Press',
      'Incline DB Press',
      'Cable Fly',
      'Lateral Raise',
      'Tricep Pushdown'
    ]
  };

  const pendingLogs = [
    {
      id: 'sess-2',
      title: 'Pull Day A',
      date: 'Feb 7',
      missing: ['RSM scores', 'Soreness']
    }
  ];

  const recentSessions = [
    {
      id: 'sess-3',
      title: 'Legs A',
      date: 'Feb 6',
      setsCompleted: 18,
      totalSets: 18,
      rsmTotal: 7
    },
    {
      id: 'sess-2',
      title: 'Pull Day A',
      date: 'Feb 5',
      setsCompleted: 16,
      totalSets: 16,
      rsmTotal: 6
    },
    {
      id: 'sess-1',
      title: 'Push Day B',
      date: 'Feb 3',
      setsCompleted: 14,
      totalSets: 14,
      rsmTotal: 5
    }
  ];
</script>

<div class="mx-auto max-w-lg space-y-4 p-4">
  <!-- Mesocycle overview -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-lg font-semibold">{currentMesocycle.title}</h1>
      <p class="text-muted-foreground text-sm">
        Week {currentMesocycle.week} of {currentMesocycle.totalWeeks}
      </p>
    </div>
    <Badge variant="secondary">{currentMesocycle.cycleType}</Badge>
  </div>
  <Progress
    value={(currentMesocycle.week / currentMesocycle.totalWeeks) * 100}
    max={100}
    class="h-1.5"
  />

  <!-- Next session CTA -->
  <Card>
    <CardHeader>
      <CardTitle>Next Up</CardTitle>
      <CardDescription>{nextSession.title}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-3">
      <p class="text-muted-foreground text-sm">{nextSession.description}</p>
      <div class="flex flex-wrap gap-1.5">
        {#each nextSession.exercises as exercise (exercise)}
          <Badge variant="outline">{exercise}</Badge>
        {/each}
      </div>
      <Button href="/session/{nextSession.id}" class="w-full" size="lg">
        <IconPlayerPlay size={18} data-icon="inline-start" />
        Start Session
      </Button>
    </CardContent>
  </Card>

  <!-- Pending logs -->
  {#if pendingLogs.length > 0}
    <Card>
      <CardHeader>
        <CardTitle class="text-destructive flex items-center gap-2">
          <IconAlertCircle size={16} />
          Pending Logs
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-2">
        {#each pendingLogs as log (log.id)}
          <a
            href="/session/{log.id}"
            class="hover:bg-muted flex items-center justify-between rounded-lg p-2 transition-colors"
          >
            <div>
              <p class="text-sm font-medium">{log.title}</p>
              <p class="text-muted-foreground text-xs">
                {log.date} - Missing: {log.missing.join(', ')}
              </p>
            </div>
            <IconChevronRight size={16} class="text-muted-foreground" />
          </a>
        {/each}
      </CardContent>
    </Card>
  {/if}

  <!-- Recent sessions -->
  <div>
    <h2 class="mb-2 text-sm font-medium">Recent Sessions</h2>
    <div class="space-y-2">
      {#each recentSessions as session (session.id)}
        <a href="/session/{session.id}" class="block">
          <Card size="sm">
            <CardContent class="flex items-center gap-3">
              <div
                class="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg"
              >
                <IconBarbell size={18} class="text-primary" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between">
                  <p class="truncate text-sm font-medium">{session.title}</p>
                  <span class="text-muted-foreground shrink-0 text-xs">{session.date}</span>
                </div>
                <div class="text-muted-foreground mt-0.5 flex items-center gap-3 text-xs">
                  <span>{session.setsCompleted}/{session.totalSets} sets</span>
                  <span>RSM: {session.rsmTotal}/9</span>
                </div>
              </div>
              <IconChevronRight size={16} class="text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </a>
      {/each}
    </div>
  </div>

  <!-- Quick links -->
  <Separator />
  <div class="grid grid-cols-2 gap-2">
    <Button variant="outline" href="/plan" class="h-auto flex-col gap-1 py-3">
      <IconCalendarEvent size={20} />
      <span class="text-xs">Plan Mesocycle</span>
    </Button>
    <Button variant="outline" href="/analytics" class="h-auto flex-col gap-1 py-3">
      <IconTrendingUp size={20} />
      <span class="text-xs">View Analytics</span>
    </Button>
  </div>
</div>
