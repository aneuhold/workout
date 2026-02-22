<!--
  @component

  Storybook wrapper that demonstrates RadioGroup with complex content
  including icons, titles, and descriptions per option.
-->
<script lang="ts">
  import { IconFlame, IconMoon, IconTrophy } from '@tabler/icons-svelte';
  import Label from '$ui/Label/Label.svelte';
  import RadioGroup from './RadioGroup.svelte';
  import RadioGroupItem from './RadioGroupItem.svelte';

  let {
    value = $bindable('intensity'),
    disabled = false,
    orientation = 'vertical'
  }: {
    value?: string;
    disabled?: boolean;
    orientation?: 'vertical' | 'horizontal';
  } = $props();
</script>

<RadioGroup
  bind:value
  {disabled}
  class={orientation === 'horizontal' ? 'flex gap-6' : 'flex flex-col gap-3'}
>
  <div class="flex items-center gap-2">
    <RadioGroupItem value="intensity" id="sb-complex-intensity" />
    <Label for="sb-complex-intensity" class="flex items-start flex-col gap-0.5">
      <span class="flex items-center gap-1.5 font-medium"
        ><IconFlame size={16} /> High Intensity</span
      >
      <span class="text-xs text-muted-foreground"
        >Push sets closer to failure with heavier loads</span
      >
    </Label>
  </div>
  <div class="flex items-center gap-2">
    <RadioGroupItem value="performance" id="sb-complex-performance" />
    <Label for="sb-complex-performance" class="flex items-start flex-col gap-0.5">
      <span class="flex items-center gap-1.5 font-medium"
        ><IconTrophy size={16} /> Peak Performance</span
      >
      <span class="text-xs text-muted-foreground"
        >Optimize for strength and progressive overload</span
      >
    </Label>
  </div>
  <div class="flex items-center gap-2">
    <RadioGroupItem value="recovery" id="sb-complex-recovery" class="mt-0.5" />
    <Label for="sb-complex-recovery" class="flex items-start flex-col gap-0.5">
      <span class="flex items-center gap-1.5 font-medium"
        ><IconMoon size={16} /> Recovery Focus</span
      >
      <span class="text-xs text-muted-foreground"
        >Reduce volume and intensity for active recovery</span
      >
    </Label>
  </div>
</RadioGroup>
