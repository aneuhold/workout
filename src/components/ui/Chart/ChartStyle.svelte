<script lang="ts">
  import { CHART_THEME_SELECTORS, type ChartConfig, ChartTheme } from './ChartUtils.js';

  let { id, config }: { id: string; config: ChartConfig } = $props();

  const colorConfig = $derived(
    Object.entries(config).filter(([, itemConfig]) => itemConfig.theme || itemConfig.color)
  );

  const themeContents = $derived.by(() => {
    if (!colorConfig.length) return;

    return Object.values(ChartTheme)
      .map((theme) => {
        const cssVars = colorConfig
          .map(([colorKey, itemConfig]) => {
            const color = itemConfig.theme?.[theme] ?? itemConfig.color;
            return color ? `\t--color-${colorKey}: ${color};` : null;
          })
          .filter((line): line is string => line !== null)
          .join('\n');

        return `${CHART_THEME_SELECTORS[theme]} [data-chart=${id}] {\n${cssVars}\n}`;
      })
      .join('\n');
  });
</script>

{#if themeContents}
  {#key id}
    <svelte:element this={'style'}>
      {themeContents}
    </svelte:element>
  {/key}
{/if}
