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
  import Separator from '$ui/Separator/Separator.svelte';
  import { marketingPages } from '$util/navInfo';

  const aboutLinks = Object.values(marketingPages);

  const modeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' }
  ] as const;

  let selectedMode = $derived(userPrefersMode.current);

  function handleModeChange(value: string) {
    if (value === 'light' || value === 'dark' || value === 'system') {
      setMode(value);
    }
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

  <Separator class="mt-4" />

  <section class="flex flex-col items-center gap-2">
    <h3>About</h3>
    <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
      {#each aboutLinks as link (link.url)}
        <a
          class="text-sm text-muted-foreground hover:text-foreground hover:underline"
          href={link.url}
        >
          {link.shortTitle}
        </a>
      {/each}
    </div>
  </section>
</div>
