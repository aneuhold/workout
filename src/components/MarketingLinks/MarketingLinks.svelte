<!--
  @component

  Centered, muted, hover-underlined row of links to every page in the
  `(marketing)` route group. Iterates over `marketingPages` from
  `navInfo` so adding a new marketing page picks up everywhere this
  component is rendered.
-->
<script lang="ts">
  import { marketingPages } from '$util/navInfo';

  const links = Object.values(marketingPages);
</script>

<div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
  {#each links as link (link.url)}
    <a class="text-sm text-muted-foreground hover:text-foreground hover:underline" href={link.url}>
      {link.shortTitle}
    </a>
  {/each}
</div>
