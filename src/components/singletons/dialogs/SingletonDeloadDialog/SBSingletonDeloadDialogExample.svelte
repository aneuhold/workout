<!--
  @component

  Storybook wrapper that opens the SingletonDeloadDialog with
  configurable parameters via buttons.
-->
<script lang="ts">
  import { DateService } from '@aneuhold/core-ts-lib';
  import Button from '$ui/Button/Button.svelte';
  import { deloadDialog } from './SingletonDeloadDialog.svelte';
  import SingletonDeloadDialog from './SingletonDeloadDialog.svelte';

  type StoryMode = 'withScheduled' | 'immediateOnly';

  let { storyMode = 'withScheduled' }: { storyMode?: StoryMode } = $props();

  function openDialog() {
    const scheduledDeloadDate =
      storyMode === 'withScheduled' ? DateService.addDays(new Date(), 14) : null;

    deloadDialog.open({
      mesocycleTitle: 'Hypertrophy Block',
      scheduledDeloadDate,
      onConfirm: () => Promise.resolve()
    });
  }
</script>

<div class="flex flex-col gap-3 p-4">
  <h3 class="text-sm font-medium">Deload Dialog</h3>
  <Button onclick={openDialog}>
    Open Dialog ({storyMode === 'withScheduled' ? 'Both Date Options' : 'Immediate Only'})
  </Button>
</div>
<SingletonDeloadDialog />
