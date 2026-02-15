<!--
  @component

  Settings page with app preferences. Currently supports light/dark/system mode selection.
-->
<script lang="ts">
  import { setMode, userPrefersMode } from 'mode-watcher';
  import Label from '$ui/Label/Label.svelte';
  import Select from '$ui/Select/Select.svelte';
  import SelectContent from '$ui/Select/SelectContent.svelte';
  import SelectItem from '$ui/Select/SelectItem.svelte';
  import SelectTrigger from '$ui/Select/SelectTrigger.svelte';

  const modeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' }
  ] as const;

  let selectedMode = $derived(userPrefersMode.current);

  function handleModeChange(value: string) {
    setMode(value as 'light' | 'dark' | 'system');
  }
</script>

<div class="flex flex-col gap-4 p-4">
  <h1 class="text-xl font-semibold">Settings</h1>

  <div class="flex items-center justify-between">
    <Label>Appearance</Label>
    <Select type="single" value={selectedMode} onValueChange={handleModeChange}>
      <SelectTrigger>
        {modeOptions.find((o) => o.value === selectedMode)?.label ?? 'System'}
      </SelectTrigger>
      <SelectContent>
        {#each modeOptions as option (option.value)}
          <SelectItem value={option.value}>
            {option.label}
          </SelectItem>
        {/each}
      </SelectContent>
    </Select>
  </div>
</div>
