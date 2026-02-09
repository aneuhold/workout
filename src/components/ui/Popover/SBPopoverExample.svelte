<script lang="ts">
  import Button from '../Button/Button.svelte';
  import Popover from './Popover.svelte';
  import PopoverClose from './PopoverClose.svelte';
  import PopoverContent from './PopoverContent.svelte';
  import PopoverTrigger from './PopoverTrigger.svelte';

  let {
    triggerText = 'Open Popover',
    title = 'Popover Title',
    content = 'This is the popover content.',
    showCloseButton = false
  }: {
    triggerText?: string;
    title?: string;
    content?: string;
    showCloseButton?: boolean;
  } = $props();
</script>

<Popover>
  <PopoverTrigger>
    <Button variant="outline">{triggerText}</Button>
  </PopoverTrigger>
  <PopoverContent>
    <div class="flex flex-col gap-2">
      <h4 class="font-medium">{title}</h4>
      <p class="text-sm">{content}</p>
      {#if showCloseButton}
        <PopoverClose>
          <Button variant="outline" size="sm">Close</Button>
        </PopoverClose>
      {/if}
    </div>
  </PopoverContent>
</Popover>
