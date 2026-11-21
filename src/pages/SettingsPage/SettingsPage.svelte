<!--
  @component

  Settings page with app preferences.
-->
<script lang="ts">
  import { setMode, userPrefersMode } from 'mode-watcher';
  import AppVersion from '$components/AppVersion/AppVersion.svelte';
  import MarketingLinks from '$components/MarketingLinks/MarketingLinks.svelte';
  import Select from '$ui/Select/Select.svelte';
  import SelectContent from '$ui/Select/SelectContent.svelte';
  import SelectItem from '$ui/Select/SelectItem.svelte';
  import SelectTrigger from '$ui/Select/SelectTrigger.svelte';
  import Separator from '$ui/Separator/Separator.svelte';
  import SettingsPageAccountSection from './SettingsPageAccountSection.svelte';
  import SettingsPageMesocyclePlanningSection from './SettingsPageMesocyclePlanningSection.svelte';
  import SettingsPageSupporterCard from './SettingsPageSupporterCard.svelte';

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

<div class="flex flex-col gap-6 p-4">
  <h1 class="text-xl font-semibold">Settings</h1>

  <SettingsPageSupporterCard />

  <section class="flex items-center justify-between">
    <h2 class="font-medium">Appearance</h2>
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
  </section>

  <Separator />

  <SettingsPageMesocyclePlanningSection />

  <Separator />

  <SettingsPageAccountSection />

  <Separator />

  <section class="flex flex-col items-center gap-2">
    <h3>About</h3>
    <MarketingLinks />
  </section>

  <AppVersion />
</div>
