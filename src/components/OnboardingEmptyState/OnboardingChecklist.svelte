<!--
  @component

  First-run onboarding checklist: 4 numbered steps guiding the user through the
  prerequisite chain to their first workout. Only the first incomplete step
  renders an action button to enforce ordering.
-->
<script lang="ts">
  import { IconCheck, IconChevronRight } from '@tabler/icons-svelte';
  import { goto } from '$app/navigation';
  import { equipmentFormDialog } from '$components/singletons/dialogs/SingletonEquipmentFormDialog/SingletonEquipmentFormDialog.svelte';
  import { muscleGroupDefaultsDialog } from '$components/singletons/dialogs/SingletonMuscleGroupDefaultsDialog/SingletonMuscleGroupDefaultsDialog.svelte';
  import equipmentTypeMapService from '$services/documentMapServices/equipmentTypeMapService.svelte';
  import exerciseMapService from '$services/documentMapServices/exerciseMapService.svelte';
  import muscleGroupMapService from '$services/documentMapServices/muscleGroupMapService.svelte';
  import sessionMapService from '$services/documentMapServices/sessionMapService.svelte';
  import Button from '$ui/Button/Button.svelte';
  import Card from '$ui/Card/Card.svelte';
  import CardContent from '$ui/Card/CardContent.svelte';
  import CardHeader from '$ui/Card/CardHeader.svelte';
  import { cn } from '$util/svelte-shadcn-util.js';

  type Step = {
    label: string;
    actionLabel: string;
    done: boolean;
    action: () => void;
  };

  let muscleGroupDone = $derived(muscleGroupMapService.allDocs.length > 0);
  let equipmentDone = $derived(equipmentTypeMapService.allDocs.length > 0);
  let exerciseDone = $derived(exerciseMapService.allDocs.length > 0);

  function startFreeFormSession() {
    const session = sessionMapService.createFreeFormSession();
    void goto(`/session?sessionId=${session._id}`);
  }

  let steps: Step[] = $derived([
    {
      label: 'Create a muscle group',
      actionLabel: 'Add muscle group',
      done: muscleGroupDone,
      action: () => muscleGroupDefaultsDialog.open()
    },
    {
      label: 'Add an equipment type',
      actionLabel: 'Add equipment',
      done: equipmentDone,
      action: () => equipmentFormDialog.openNew()
    },
    {
      label: 'Create your first exercise',
      actionLabel: 'Create exercise',
      done: exerciseDone,
      action: () => void goto('/exercise/new')
    },
    {
      label: 'Start a free-form workout',
      actionLabel: 'Start workout',
      done: false,
      action: startFreeFormSession
    }
  ]);

  let currentStepIndex = $derived(steps.findIndex((s) => !s.done));
</script>

<Card class="w-full max-w-md">
  <CardHeader>
    <p class="font-medium text-foreground">Let's get you set up</p>
    <p class="text-xs text-muted-foreground">A few quick steps to log your first workout.</p>
  </CardHeader>
  <CardContent class="flex flex-col gap-2">
    {#each steps as step, i (step.label)}
      {@const isCurrent = i === currentStepIndex}
      <div
        class={cn(
          'flex items-center gap-3 rounded-md border p-3',
          step.done && 'opacity-60',
          isCurrent && 'bg-primary/5 ring-1 ring-primary animate-fade-in-up'
        )}
      >
        <div
          class={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
            step.done && 'bg-primary text-primary-foreground border-primary',
            isCurrent && 'border-primary text-primary'
          )}
        >
          {#if step.done}
            <IconCheck size={14} />
          {:else}
            {i + 1}
          {/if}
        </div>
        <span
          class={cn(
            'flex-1 text-sm',
            step.done ? 'text-muted-foreground line-through' : 'text-foreground'
          )}
        >
          {step.label}
        </span>
        {#if isCurrent}
          <Button size="sm" onclick={step.action}>
            {step.actionLabel}
            <IconChevronRight size={14} />
          </Button>
        {/if}
      </div>
    {/each}
  </CardContent>
</Card>
