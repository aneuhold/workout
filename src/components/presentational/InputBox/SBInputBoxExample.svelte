<script lang="ts">
  import { type ComponentProps } from 'svelte';
  import InputBox from './InputBox.svelte';

  let {
    initialValue = '',
    ...rest
  }: {
    initialValue?: string | number;
  } & Omit<ComponentProps<typeof InputBox>, 'inputValue' | 'onBlurValue'> = $props();

  let onBlurValue = $derived<string | number>(initialValue);
  let inputValue = $derived<string | number>(initialValue);
</script>

<div>
  <InputBox bind:onBlurValue bind:inputValue {...rest} />

  <p>
    <span>Current inputValue:</span>
    <code>{inputValue}</code>
  </p>
  <p>
    <span>Current onBlurValue:</span>
    <code>{onBlurValue}</code>
  </p>
</div>
