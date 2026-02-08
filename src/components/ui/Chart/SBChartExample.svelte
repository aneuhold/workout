<script lang="ts">
  import { scaleBand } from 'd3-scale';
  import { BarChart, type ChartContextValue } from 'layerchart';
  import { cubicInOut } from 'svelte/easing';
  import ChartContainer from './ChartContainer.svelte';
  import ChartTooltip from './ChartTooltip.svelte';
  import type { ChartConfig } from './ChartUtils.js';

  let {
    seriesLayout = 'group',
    showLegend = false,
    showTooltip = true
  }: {
    seriesLayout?: 'stack' | 'group';
    showLegend?: boolean;
    showTooltip?: boolean;
  } = $props();

  const chartData = [
    { month: 'January', desktop: 186, mobile: 80 },
    { month: 'February', desktop: 305, mobile: 200 },
    { month: 'March', desktop: 237, mobile: 120 },
    { month: 'April', desktop: 73, mobile: 190 },
    { month: 'May', desktop: 209, mobile: 130 },
    { month: 'June', desktop: 214, mobile: 140 }
  ];

  const chartConfig = {
    desktop: {
      label: 'Desktop',
      color: '#2563eb'
    },
    mobile: {
      label: 'Mobile',
      color: '#60a5fa'
    }
  } satisfies ChartConfig;

  let context = $state<ChartContextValue>();
</script>

<ChartContainer config={chartConfig}>
  <BarChart
    bind:context
    data={chartData}
    xScale={scaleBand().padding(0.25)}
    x="month"
    axis="x"
    {seriesLayout}
    legend={showLegend}
    tooltip={!showTooltip}
    series={[
      {
        key: 'desktop',
        label: chartConfig.desktop.label,
        color: chartConfig.desktop.color
      },
      {
        key: 'mobile',
        label: chartConfig.mobile.label,
        color: chartConfig.mobile.color
      }
    ]}
    props={{
      bars: {
        stroke: 'none',
        strokeWidth: 0,
        rounded: 'all',
        // use the height of the chart to animate the bars
        initialY: context?.height,
        initialHeight: 0,
        motion: {
          y: { type: 'tween', duration: 500, easing: cubicInOut },
          height: { type: 'tween', duration: 500, easing: cubicInOut }
        }
      },
      highlight: { area: { fill: 'none' } },
      xAxis: {
        format: (d) => d.slice(0, 3)
      }
    }}
  >
    {#if showTooltip}
      <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
      {#snippet tooltip()}
        <ChartTooltip />
      {/snippet}
    {/if}
  </BarChart>
</ChartContainer>
