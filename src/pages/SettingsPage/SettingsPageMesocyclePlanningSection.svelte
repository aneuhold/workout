<!--
  @component

  Mesocycle planning section for the Settings page. Holds the user's settings
  that control how mesocycles are planned.
-->
<script lang="ts">
  import {
    WorkoutMesocyclePlanningSettingsSchema,
    WorkoutRecoverySessionBehavior
  } from '@aneuhold/core-ts-db-lib';
  import userConfigService from '$services/UserConfigService/UserConfig.service.svelte';
  import Label from '$ui/Label/Label.svelte';
  import RadioGroup from '$ui/RadioGroup/RadioGroup.svelte';
  import RadioGroupItem from '$ui/RadioGroup/RadioGroupItem.svelte';

  const recoverySessionBehaviorOptions = [
    {
      value: WorkoutRecoverySessionBehavior.HalveSets,
      label: 'Halve sets',
      description:
        'The recovery session uses half the sets from the previous microcycle, with a minimum of 1 set. (Default)'
    },
    {
      value: WorkoutRecoverySessionBehavior.MaintainSets,
      label: 'Keep sets',
      description:
        'The recovery session keeps the set count from the previous microcycle, with no sets added. Progression continues normally afterwards.'
    }
  ];

  let recoverySessionBehavior = $derived(
    userConfigService.config.mesocyclePlanningSettings.recoverySessionBehavior
  );

  function handleRecoverySessionBehaviorChange(value: string) {
    const result =
      WorkoutMesocyclePlanningSettingsSchema.shape.recoverySessionBehavior.safeParse(value);
    if (!result.success) return;
    userConfigService.update((config) => ({
      ...config,
      mesocyclePlanningSettings: {
        ...config.mesocyclePlanningSettings,
        recoverySessionBehavior: result.data
      }
    }));
  }
</script>

<section class="flex flex-col gap-3">
  <h2 class="font-medium">Mesocycle planning</h2>
  <div class="flex flex-col gap-1">
    <Label id="recovery-session-behavior-label">Recovery sessions</Label>
    <p class="text-muted-foreground text-sm">
      When an exercise is showing low performance compared to the targets, the next session becomes
      a recovery session for that exercise. This setting controls how that behaves.
    </p>
  </div>
  <RadioGroup
    value={recoverySessionBehavior}
    onValueChange={handleRecoverySessionBehaviorChange}
    aria-labelledby="recovery-session-behavior-label"
  >
    {#each recoverySessionBehaviorOptions as option (option.value)}
      {@const id = `recovery-session-behavior-${option.value}`}
      <div class="flex items-start gap-2">
        <RadioGroupItem value={option.value} {id} />
        <Label for={id} class="flex flex-col items-start gap-1">
          {option.label}
          <span class="text-muted-foreground font-normal">
            {option.description}
          </span>
        </Label>
      </div>
    {/each}
  </RadioGroup>
</section>
