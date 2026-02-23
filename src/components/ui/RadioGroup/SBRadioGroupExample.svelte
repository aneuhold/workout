<!--
  @component

  Storybook wrapper that demonstrates RadioGroup with various configurations.
  Supports both simple label-only options and complex options with icons and descriptions.
-->
<script lang="ts">
  import { IconFlame, IconMoon, IconTrophy } from '@tabler/icons-svelte';
  import Label from '$ui/Label/Label.svelte';
  import RadioGroup from './RadioGroup.svelte';
  import RadioGroupItem from './RadioGroupItem.svelte';

  let {
    value = $bindable('option-1'),
    disabled = false,
    orientation = 'vertical' as 'vertical' | 'horizontal',
    complex = false
  }: {
    value?: string;
    disabled?: boolean;
    orientation?: 'vertical' | 'horizontal';
    complex?: boolean;
  } = $props();
</script>

{#if complex}
  <RadioGroup
    bind:value
    {disabled}
    class={orientation === 'horizontal' ? 'flex gap-6' : 'flex flex-col gap-3'}
  >
    <div class="flex items-center gap-2">
      <RadioGroupItem value="option-1" id="sb-complex-1" />
      <Label for="sb-complex-1" class="flex items-start flex-col gap-0.5">
        <span class="flex items-center gap-1.5 font-medium"
          ><IconFlame size={16} /> High Intensity</span
        >
        <span class="text-xs text-muted-foreground"
          >Push sets closer to failure with heavier loads</span
        >
      </Label>
    </div>
    <div class="flex items-center gap-2">
      <RadioGroupItem value="option-2" id="sb-complex-2" />
      <Label for="sb-complex-2" class="flex items-start flex-col gap-0.5">
        <span class="flex items-center gap-1.5 font-medium"
          ><IconTrophy size={16} /> Peak Performance</span
        >
        <span class="text-xs text-muted-foreground"
          >Optimize for strength and progressive overload</span
        >
      </Label>
    </div>
    <div class="flex items-center gap-2">
      <RadioGroupItem value="option-3" id="sb-complex-3" />
      <Label for="sb-complex-3" class="flex items-start flex-col gap-0.5">
        <span class="flex items-center gap-1.5 font-medium"
          ><IconMoon size={16} /> Recovery Focus</span
        >
        <span class="text-xs text-muted-foreground"
          >Reduce volume and intensity for active recovery</span
        >
      </Label>
    </div>
  </RadioGroup>
{:else}
  <RadioGroup bind:value {disabled} class={orientation === 'horizontal' ? 'flex gap-4' : ''}>
    <div class="flex items-center gap-2">
      <RadioGroupItem value="option-1" id="sb-option-1" />
      <Label for="sb-option-1">Option 1</Label>
    </div>
    <div class="flex items-center gap-2">
      <RadioGroupItem value="option-2" id="sb-option-2" />
      <Label for="sb-option-2">Option 2</Label>
    </div>
    <div class="flex items-center gap-2">
      <RadioGroupItem value="option-3" id="sb-option-3" />
      <Label for="sb-option-3">Option 3</Label>
    </div>
  </RadioGroup>
{/if}
