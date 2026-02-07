<script lang="ts">
  let { tagName }: { tagName: string } = $props();
</script>

<div class="container">
  <i class="tagHeader mdc-typography--body2 mdc-theme--text-hint-on-background">{tagName}</i>
</div>

<style>
  .container {
    width: 100%;
    padding: 4px;
    display: flex;
    flex-direction: row;
  }
  .tagHeader {
    border-radius: 2px;
    border-color: var(--mdc-theme-text-hint-on-background);
    border-width: 1px;
  }
</style>
