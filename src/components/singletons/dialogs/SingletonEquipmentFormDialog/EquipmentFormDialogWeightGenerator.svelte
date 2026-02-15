<script lang="ts">
  import { WorkoutEquipmentTypeService } from '@aneuhold/core-ts-db-lib';
  import { IconPlus, IconX } from '@tabler/icons-svelte';
  import Button from '$ui/Button/Button.svelte';
  import Input from '$ui/Input/Input.svelte';
  import Label from '$ui/Label/Label.svelte';
  import Tabs from '$ui/Tabs/Tabs.svelte';
  import TabsContent from '$ui/Tabs/TabsContent.svelte';
  import TabsList from '$ui/Tabs/TabsList.svelte';
  import TabsTrigger from '$ui/Tabs/TabsTrigger.svelte';

  let {
    onGenerate,
    onDone
  }: {
    onGenerate: (weights: number[]) => void;
    onDone: () => void;
  } = $props();

  let activeTab = $state('flat');

  // Flat / Machine weight state
  let flatMin = $state(5);
  let flatIncrement = $state(5);
  let flatMax = $state(100);

  // Plate-based state
  let barWeight = $state(45);
  let plateEntries = $state<Array<{ weight: number; pairs: number }>>([{ weight: 45, pairs: 4 }]);

  // Derived: generator output from active tab's params
  let generatorOutput = $derived.by(() => {
    if (activeTab === 'flat') {
      if (isNaN(flatMin) || isNaN(flatIncrement) || isNaN(flatMax)) return [];
      if (flatMin < 0 || flatIncrement <= 0 || flatMax < flatMin) return [];
      const count = Math.floor((flatMax - flatMin) / flatIncrement) + 1;
      if (count > 1000) return [];
      return WorkoutEquipmentTypeService.generateWeightOptions(flatMin, flatIncrement, flatMax);
    } else {
      if (isNaN(barWeight) || barWeight < 0) return [];
      return WorkoutEquipmentTypeService.generatePlateWeightOptions(barWeight, plateEntries);
    }
  });

  // Live-sync: push generator output to parent
  $effect(() => {
    const output = generatorOutput;
    onGenerate(output);
  });

  function addPlateEntry() {
    plateEntries = [...plateEntries, { weight: 10, pairs: 2 }];
  }

  function removePlateEntry(index: number) {
    plateEntries = plateEntries.filter((_, i) => i !== index);
  }
</script>

<div class="flex flex-col gap-3 rounded-md border border-border p-3">
  <p class="text-xs font-medium text-muted-foreground">Generate</p>
  <Tabs bind:value={activeTab}>
    <TabsList class="w-full">
      <TabsTrigger value="flat">Flat / Machine</TabsTrigger>
      <TabsTrigger value="plates">Plates</TabsTrigger>
    </TabsList>

    <TabsContent value="flat">
      <div class="grid grid-cols-3 gap-2">
        <div class="flex flex-col gap-1">
          <Label for="eq-min">Min (lb)</Label>
          <Input id="eq-min" type="number" bind:value={flatMin} min="0" step="any" />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="eq-inc">Increment</Label>
          <Input id="eq-inc" type="number" bind:value={flatIncrement} min="0" step="any" />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="eq-max">Max (lb)</Label>
          <Input id="eq-max" type="number" bind:value={flatMax} min="0" step="any" />
        </div>
      </div>
    </TabsContent>

    <TabsContent value="plates">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <Label for="eq-bar">Bar weight (lb)</Label>
          <Input id="eq-bar" type="number" bind:value={barWeight} min="0" step="any" />
        </div>
        <div class="flex flex-col gap-2">
          <Label>Plates</Label>
          {#each plateEntries as entry, index (index)}
            <div class="flex items-end gap-2">
              <div class="flex flex-1 flex-col gap-1">
                {#if index === 0}
                  <Label class="text-xs">Weight (lb)</Label>
                {/if}
                <Input type="number" bind:value={entry.weight} min="0" step="any" />
              </div>
              <div class="flex flex-1 flex-col gap-1">
                {#if index === 0}
                  <Label class="text-xs">Pairs</Label>
                {/if}
                <Input type="number" bind:value={entry.pairs} min="1" step="1" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                class="size-9 shrink-0"
                onclick={() => removePlateEntry(index)}
              >
                <IconX class="size-4" />
              </Button>
            </div>
          {/each}
          <Button variant="outline" size="sm" type="button" class="w-fit" onclick={addPlateEntry}>
            <IconPlus class="size-4" />
            Add plate
          </Button>
        </div>
      </div>
    </TabsContent>
  </Tabs>

  <Button variant="outline" size="sm" type="button" class="w-fit" onclick={onDone}>Done</Button>
</div>
