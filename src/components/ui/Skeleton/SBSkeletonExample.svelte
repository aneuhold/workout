<script lang="ts" module>
  export enum SBSkeletonExampleLayoutType {
    Default = 'Default',
    Card = 'Card',
    Lines = 'Lines',
    Avatar = 'Avatar'
  }
</script>

<script lang="ts">
  import Skeleton from './Skeleton.svelte';

  let {
    layout = SBSkeletonExampleLayoutType.Default
  }: {
    layout?: SBSkeletonExampleLayoutType;
  } = $props();
</script>

{#if layout === SBSkeletonExampleLayoutType.Default}
  <div class="flex items-center space-x-4">
    <Skeleton class="h-12 w-12 rounded-full" />
    <div class="space-y-2">
      <Skeleton class="h-4 w-62.5" />
      <Skeleton class="h-4 w-50" />
    </div>
  </div>
{:else if layout === SBSkeletonExampleLayoutType.Card}
  <div class="flex flex-col space-y-3">
    <Skeleton class="h-31.25 w-62.5 rounded-xl" />
    <div class="space-y-2">
      <Skeleton class="h-4 w-62.5" />
      <Skeleton class="h-4 w-50" />
    </div>
  </div>
{:else if layout === SBSkeletonExampleLayoutType.Lines}
  <div class="space-y-2">
    <Skeleton class="h-4 w-full" />
    <Skeleton class="h-4 w-full" />
    <Skeleton class="h-4 w-3/4" />
  </div>
{:else if layout === SBSkeletonExampleLayoutType.Avatar}
  <Skeleton class="h-12 w-12 rounded-full" />
{/if}
