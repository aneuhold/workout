<!--
  @component

  Reusable slider field for session exercise metrics.
  Uses a 0-4 internal range where 0 = "Not Set" and 1-4 map to scores 0-3.
  Supports color coding, disabled state, and highlight ring for review mode.
-->
<script lang="ts">
  import InfoPopover from '$components/InfoPopover/InfoPopover.svelte';
  import Label from '$ui/Label/Label.svelte';
  import Slider from '$ui/Slider/Slider.svelte';
  import { SessionPageSliderColorMode } from './sessionPageTypes';

  let {
    label,
    value,
    descriptions,
    colorMode,
    disabled = false,
    highlight = false,
    onValueChange
  }: {
    label: string;
    value: number | null | undefined;
    descriptions: string[];
    colorMode: SessionPageSliderColorMode;
    disabled?: boolean;
    highlight?: boolean;
    onValueChange: (value: number | null) => void;
  } = $props();

  function toSliderValue(v: number | null | undefined): number[] {
    return [v != null ? v + 1 : 0];
  }

  function fromSliderValue(v: number[]): number | null {
    return v[0] === 0 ? null : v[0] - 1;
  }

  let sliderValue = $derived(toSliderValue(value));

  function handleChange(newValue: number[]) {
    onValueChange(fromSliderValue(newValue));
  }

  let displayValue = $derived(fromSliderValue(sliderValue));

  function getScoreColor(score: number | null): string {
    if (score === null) return 'text-muted-foreground';
    if (colorMode === SessionPageSliderColorMode.Positive) {
      const colors = [
        'text-muted-foreground',
        'text-green-500',
        'text-green-600',
        'text-green-700'
      ];
      return colors[score] ?? 'text-muted-foreground';
    }
    if (colorMode === SessionPageSliderColorMode.Negative) {
      const colors = ['text-muted-foreground', 'text-orange-500', 'text-red-500', 'text-red-700'];
      return colors[score] ?? 'text-muted-foreground';
    }
    // performance: neutral for 0-2, red for 3
    if (score === 3) return 'text-red-600';
    return 'text-muted-foreground';
  }
</script>

<div class={highlight ? 'rounded-lg ring-1 ring-primary/30 p-2' : ''}>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-1.5">
      <Label>{label}</Label>
      <InfoPopover>
        <ul class="flex flex-col gap-1.5 text-sm">
          {#each descriptions as desc, i (i)}
            <li><strong>{i}:</strong> {desc}</li>
          {/each}
        </ul>
      </InfoPopover>
    </div>
    <Slider
      type="multiple"
      value={sliderValue}
      onValueChange={handleChange}
      min={0}
      max={4}
      step={1}
      {disabled}
    />
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium {getScoreColor(displayValue)}">
        {displayValue !== null ? displayValue : 'Not Set'}
      </span>
    </div>
    {#if displayValue !== null}
      <p class="text-xs text-muted-foreground">{descriptions[displayValue]}</p>
    {/if}
  </div>
</div>
