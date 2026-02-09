<script lang="ts">
  import Button from '../Button/Button.svelte';
  import Sheet from './Sheet.svelte';
  import SheetClose from './SheetClose.svelte';
  import SheetContent from './SheetContent.svelte';
  import SheetDescription from './SheetDescription.svelte';
  import SheetFooter from './SheetFooter.svelte';
  import SheetHeader from './SheetHeader.svelte';
  import SheetTitle from './SheetTitle.svelte';
  import SheetTrigger from './SheetTrigger.svelte';

  type Side = 'top' | 'right' | 'bottom' | 'left';

  let {
    side = 'right',
    title = 'Sheet Title',
    description = 'This is a sheet description.',
    triggerText = 'Open Sheet',
    showFooter = true
  }: {
    side?: Side;
    title?: string;
    description?: string;
    triggerText?: string;
    showFooter?: boolean;
  } = $props();
</script>

<Sheet>
  <SheetTrigger>
    <Button>{triggerText}</Button>
  </SheetTrigger>
  <SheetContent {side}>
    <SheetHeader>
      <SheetTitle>{title}</SheetTitle>
      <SheetDescription>{description}</SheetDescription>
    </SheetHeader>
    <div class="py-4">Sheet content goes here.</div>
    {#if showFooter}
      <SheetFooter>
        <SheetClose>
          <Button variant="outline">Close</Button>
        </SheetClose>
      </SheetFooter>
    {/if}
  </SheetContent>
</Sheet>
