<script lang="ts">
  import Pagination from './Pagination.svelte';
  import PaginationContent from './PaginationContent.svelte';
  import PaginationEllipsis from './PaginationEllipsis.svelte';
  import PaginationItem from './PaginationItem.svelte';
  import PaginationLink from './PaginationLink.svelte';
  import PaginationNext from './PaginationNext.svelte';
  import PaginationPrevious from './PaginationPrevious.svelte';

  let {
    totalPages = 10,
    siblingCount = 1,
    showEllipsis = true
  }: {
    totalPages?: number;
    siblingCount?: number;
    showEllipsis?: boolean;
  } = $props();

  let page = $state(1);

  const count = $derived(totalPages * 10);
</script>

<Pagination bind:page {count} perPage={10} {siblingCount}>
  {#snippet children({ pages })}
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious />
      </PaginationItem>
      {#each pages as p (p.key)}
        {#if p.type === 'page'}
          <PaginationItem>
            <PaginationLink page={p} isActive={page === p.value} />
          </PaginationItem>
        {:else if showEllipsis}
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        {/if}
      {/each}
      <PaginationItem>
        <PaginationNext />
      </PaginationItem>
    </PaginationContent>
  {/snippet}
</Pagination>
