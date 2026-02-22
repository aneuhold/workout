<!--
  @component

  Storybook wrapper that demonstrates RadioGroup with various configurations.
-->
<script lang="ts">
  import Label from '$ui/Label/Label.svelte';
  import RadioGroup from './RadioGroup.svelte';
  import RadioGroupItem from './RadioGroupItem.svelte';

  let {
    value = $bindable('option-1'),
    disabled = false,
    orientation = 'vertical' as 'vertical' | 'horizontal'
  }: {
    value?: string;
    disabled?: boolean;
    orientation?: 'vertical' | 'horizontal';
  } = $props();
</script>

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
