<!--
  @component

  A grouping of architecture items.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    direction = 'row',
    borderTop = true,
    borderLeft = false,
    borderRight = false,
    borderBottom = false,
    children
  }: {
    direction?: 'row' | 'column';
    borderTop?: boolean;
    borderLeft?: boolean;
    borderRight?: boolean;
    borderBottom?: boolean;
    children?: Snippet;
  } = $props();

  const className = $derived(() => {
    return `grouping ${direction} ${borderTop ? 'border-top' : ''} ${
      borderLeft ? 'border-left' : ''
    } ${borderRight ? 'border-right' : ''} ${borderBottom ? 'border-bottom' : ''}`;
  });
</script>

<div class={className}>
  {@render children?.()}
</div>

<style>
  .grouping {
    display: grid;
    border-width: 2px;
    border-color: var(--mdc-theme-secondary, #5d5d78);

    &.row {
      /* 300px seemed good for the individual cards */
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    &.column {
      grid-template-columns: 1fr;
    }

    &.border-top {
      border-top-style: solid;
    }
    &.border-left {
      border-left-style: solid;
    }
    &.border-right {
      border-right-style: solid;
    }
    &.border-bottom {
      border-bottom-style: solid;
    }
  }
</style>
