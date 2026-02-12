<script lang="ts">
  import { scaleBand } from 'd3-scale';
  import { BarChart } from 'layerchart';
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
      color: 'var(--chart-1)'
    },
    mobile: {
      label: 'Mobile',
      color: 'var(--chart-3)'
    }
  } satisfies ChartConfig;
</script>

<ChartContainer config={chartConfig}>
  {#if showTooltip}
    <BarChart
      data={chartData}
      xScale={scaleBand().padding(0.25)}
      x="month"
      axis="x"
      {seriesLayout}
      legend={showLegend}
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
        xAxis: {
          format: (d) => d.slice(0, 3)
        }
      }}
    >
      <!-- It seems like this has to be at the root inside of BarChart in order to work, otherwise
       there would be a conditional here.-->
      {#snippet tooltip()}
        <ChartTooltip />
      {/snippet}
    </BarChart>
  {:else}
    <BarChart
      data={chartData}
      xScale={scaleBand().padding(0.25)}
      x="month"
      axis="x"
      {seriesLayout}
      legend={showLegend}
      tooltip={false}
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
        xAxis: {
          format: (d) => d.slice(0, 3)
        }
      }}
    />
  {/if}
</ChartContainer>
