<!--
  @component

  Analytics page. Shows volume trends, SFR analysis, session performance,
  and muscle group breakdown using charts and summary cards.
-->
<script lang="ts">
  import {
    IconActivity,
    IconFlame,
    IconMinus,
    IconTargetArrow,
    IconTrendingDown,
    IconTrendingUp
  } from '@tabler/icons-svelte';
  import { scaleBand } from 'd3-scale';
  import { BarChart } from 'layerchart';
  import Badge from '$ui/Badge/Badge.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardDescription from '$ui/Card/CardDescription.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import CardTitle from '$ui/Card/CardTitle.svelte';
  import ChartContainer from '$ui/Chart/ChartContainer.svelte';
  import ChartTooltip from '$ui/Chart/ChartTooltip.svelte';
  import type { ChartConfig } from '$ui/Chart/ChartUtils.js';
  import Separator from '$ui/Separator/Separator.svelte';
  import Tabs from '$ui/Tabs/Tabs.svelte';
  import TabsList from '$ui/Tabs/TabsList.svelte';
  import TabsTrigger from '$ui/Tabs/TabsTrigger.svelte';

  // Fake analytics data
  const weeklyVolume = [
    { week: 'W1', chest: 8, back: 8, legs: 10, shoulders: 6, arms: 6 },
    { week: 'W2', chest: 10, back: 10, legs: 12, shoulders: 8, arms: 8 },
    { week: 'W3', chest: 12, back: 12, legs: 14, shoulders: 9, arms: 9 },
    { week: 'W4', chest: 14, back: 13, legs: 16, shoulders: 10, arms: 10 },
    { week: 'W5', chest: 16, back: 15, legs: 18, shoulders: 12, arms: 12 }
  ];

  const volumeConfig = {
    chest: { label: 'Chest', color: 'var(--chart-1)' },
    back: { label: 'Back', color: 'var(--chart-2)' },
    legs: { label: 'Legs', color: 'var(--chart-3)' },
    shoulders: { label: 'Shoulders', color: 'var(--chart-4)' },
    arms: { label: 'Arms', color: 'var(--chart-5)' }
  } satisfies ChartConfig;

  const sessionPerformance = [
    { session: 'Push A', rsm: 7, fatigue: 5, sfr: 1.4 },
    { session: 'Pull A', rsm: 6, fatigue: 4, sfr: 1.5 },
    { session: 'Legs A', rsm: 8, fatigue: 7, sfr: 1.1 },
    { session: 'Push B', rsm: 6, fatigue: 4, sfr: 1.5 },
    { session: 'Pull B', rsm: 7, fatigue: 5, sfr: 1.4 },
    { session: 'Legs B', rsm: 7, fatigue: 6, sfr: 1.2 }
  ];

  const sfrConfig = {
    rsm: { label: 'RSM', color: 'var(--chart-1)' },
    fatigue: { label: 'Fatigue', color: 'var(--chart-3)' }
  } satisfies ChartConfig;

  const muscleGroupSummary = [
    { name: 'Chest', setsThisWeek: 12, weeklyTarget: 14, trend: 'up', sfr: 1.4 },
    { name: 'Back', setsThisWeek: 12, weeklyTarget: 14, trend: 'up', sfr: 1.5 },
    { name: 'Quads', setsThisWeek: 8, weeklyTarget: 10, trend: 'same', sfr: 1.1 },
    { name: 'Hamstrings', setsThisWeek: 6, weeklyTarget: 8, trend: 'up', sfr: 1.3 },
    { name: 'Glutes', setsThisWeek: 8, weeklyTarget: 10, trend: 'same', sfr: 1.2 },
    { name: 'Side Delts', setsThisWeek: 6, weeklyTarget: 8, trend: 'down', sfr: 1.0 },
    { name: 'Triceps', setsThisWeek: 9, weeklyTarget: 10, trend: 'up', sfr: 1.6 },
    { name: 'Biceps', setsThisWeek: 8, weeklyTarget: 10, trend: 'up', sfr: 1.5 }
  ];

  const summaryStats = [
    { label: 'Avg RSM', value: '6.8', subtext: '/9', icon: IconActivity, trend: 'up' },
    { label: 'Avg SFR', value: '1.35', subtext: '', icon: IconTargetArrow, trend: 'up' },
    { label: 'Total Sets', value: '86', subtext: 'this week', icon: IconFlame, trend: 'same' }
  ];

  let activeTab = $state('volume');

  const trendIcon = (trend: string) => {
    if (trend === 'up') return IconTrendingUp;
    if (trend === 'down') return IconTrendingDown;
    return IconMinus;
  };

  const trendColor = (trend: string) => {
    if (trend === 'up') return 'text-green-500';
    if (trend === 'down') return 'text-red-500';
    return 'text-muted-foreground';
  };
</script>

<div class="mx-auto max-w-lg space-y-4 p-4">
  <h1 class="text-lg font-semibold">Analytics</h1>

  <!-- Summary stat cards -->
  <div class="grid grid-cols-3 gap-2">
    {#each summaryStats as stat (stat.label)}
      <Card size="sm">
        <CardContent class="flex flex-col items-center gap-1 pt-3 text-center">
          <stat.icon size={18} class={trendColor(stat.trend)} />
          <div>
            <span class="text-xl font-semibold">{stat.value}</span>
            <span class="text-muted-foreground text-xs">{stat.subtext}</span>
          </div>
          <p class="text-muted-foreground text-xs">{stat.label}</p>
        </CardContent>
      </Card>
    {/each}
  </div>

  <!-- Chart tabs -->
  <Tabs
    value={activeTab}
    onValueChange={(v) => {
      if (v) activeTab = v;
    }}
  >
    <TabsList class="w-full">
      <TabsTrigger value="volume" class="flex-1">Volume</TabsTrigger>
      <TabsTrigger value="sfr" class="flex-1">SFR</TabsTrigger>
      <TabsTrigger value="muscles" class="flex-1">Muscles</TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Volume Chart -->
  {#if activeTab === 'volume'}
    <Card>
      <CardHeader>
        <CardTitle>Weekly Volume by Muscle Group</CardTitle>
        <CardDescription>Effective sets per week across the mesocycle</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={volumeConfig}>
          <BarChart
            data={weeklyVolume}
            xScale={scaleBand().padding(0.2)}
            x="week"
            axis="x"
            seriesLayout="stack"
            legend={true}
            series={[
              { key: 'chest', label: 'Chest', color: volumeConfig.chest.color },
              { key: 'back', label: 'Back', color: volumeConfig.back.color },
              { key: 'legs', label: 'Legs', color: volumeConfig.legs.color },
              { key: 'shoulders', label: 'Shoulders', color: volumeConfig.shoulders.color },
              { key: 'arms', label: 'Arms', color: volumeConfig.arms.color }
            ]}
          >
            {#snippet tooltip()}
              <ChartTooltip />
            {/snippet}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  {/if}

  <!-- SFR Chart -->
  {#if activeTab === 'sfr'}
    <Card>
      <CardHeader>
        <CardTitle>RSM vs Fatigue by Session</CardTitle>
        <CardDescription>Higher RSM with lower fatigue = better SFR</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={sfrConfig}>
          <BarChart
            data={sessionPerformance}
            xScale={scaleBand().padding(0.25)}
            x="session"
            axis="x"
            seriesLayout="group"
            legend={true}
            series={[
              { key: 'rsm', label: 'RSM', color: sfrConfig.rsm.color },
              { key: 'fatigue', label: 'Fatigue', color: sfrConfig.fatigue.color }
            ]}
            props={{
              xAxis: {
                format: (d: string) => d.replace(' ', '\n')
              }
            }}
          >
            {#snippet tooltip()}
              <ChartTooltip />
            {/snippet}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>

    <!-- SFR breakdown list -->
    <Card>
      <CardHeader>
        <CardTitle>SFR by Session</CardTitle>
      </CardHeader>
      <CardContent class="space-y-2">
        {#each sessionPerformance as perf (perf.session)}
          <div class="flex items-center justify-between py-1">
            <span class="text-sm">{perf.session}</span>
            <div class="flex items-center gap-3">
              <span class="text-muted-foreground text-xs">
                RSM {perf.rsm} / Fatigue {perf.fatigue}
              </span>
              <Badge
                variant={perf.sfr >= 1.3
                  ? 'default'
                  : perf.sfr >= 1.0
                    ? 'secondary'
                    : 'destructive'}
              >
                SFR {perf.sfr.toFixed(1)}
              </Badge>
            </div>
          </div>
        {/each}
      </CardContent>
    </Card>
  {/if}

  <!-- Muscle group breakdown -->
  {#if activeTab === 'muscles'}
    <Card>
      <CardHeader>
        <CardTitle>Muscle Group Progress</CardTitle>
        <CardDescription>Weekly set volume vs target</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        {#each muscleGroupSummary as mg (mg.name)}
          {@const TrendIconComponent = trendIcon(mg.trend)}
          <div>
            <div class="mb-1 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">{mg.name}</span>
                <TrendIconComponent size={14} class={trendColor(mg.trend)} />
              </div>
              <div class="flex items-center gap-2">
                <span class="text-muted-foreground text-xs">
                  SFR {mg.sfr.toFixed(1)}
                </span>
                <span class="text-sm">
                  {mg.setsThisWeek}/{mg.weeklyTarget}
                </span>
              </div>
            </div>
            <div class="bg-muted h-2 overflow-hidden rounded-full">
              <div
                class={`h-full rounded-full transition-all ${
                  mg.setsThisWeek >= mg.weeklyTarget ? 'bg-green-500' : 'bg-primary'
                }`}
                style="width: {Math.min(100, (mg.setsThisWeek / mg.weeklyTarget) * 100)}%"
              ></div>
            </div>
          </div>
          <Separator />
        {/each}
      </CardContent>
    </Card>
  {/if}
</div>
