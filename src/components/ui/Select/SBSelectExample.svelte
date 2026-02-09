<script lang="ts">
  import Select from './Select.svelte';
  import SelectContent from './SelectContent.svelte';
  import SelectGroup from './SelectGroup.svelte';
  import SelectItem from './SelectItem.svelte';
  import SelectLabel from './SelectLabel.svelte';
  import SelectTrigger from './SelectTrigger.svelte';

  type SelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
  };

  type SelectGroupData = {
    label?: string;
    options: SelectOption[];
  };

  let {
    options,
    groups,
    size = 'default',
    placeholder = 'Select an option',
    disabled
  }: {
    groups?: SelectGroupData[];
    options?: SelectOption[];
    size?: 'default' | 'sm';
    placeholder?: string;
    disabled?: boolean;
  } = $props();

  let value = $state('');

  // Create a flat list of all options for lookup
  const allOptions = $derived(groups ? groups.flatMap((g) => g.options) : options || []);

  // Compute the trigger content based on selected value
  const triggerContent = $derived(
    allOptions.find((opt) => opt.value === value)?.label ?? placeholder
  );
</script>

<Select bind:value {disabled} type="single">
  <SelectTrigger {size}>
    {triggerContent}
  </SelectTrigger>
  <SelectContent>
    {#if groups}
      {#each groups as group, idx (group.label || idx)}
        <SelectGroup>
          {#if group.label}
            <SelectLabel>{group.label}</SelectLabel>
          {/if}
          {#each group.options as option (option.value)}
            <SelectItem value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          {/each}
        </SelectGroup>
      {/each}
    {:else if options}
      {#each options as option (option.value)}
        <SelectItem value={option.value} disabled={option.disabled}>
          {option.label}
        </SelectItem>
      {/each}
    {/if}
  </SelectContent>
</Select>
