<!--
  @component

  A single titled section of the privacy policy. The heading links to its own
  anchor so readers can grab a deep link to the section.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    id: string;
    title: string;
    children: Snippet;
  }

  let { id, title, children }: Props = $props();
</script>

<section {id} class="flex flex-col gap-2">
  <h2 class="text-xl font-semibold">
    <a class="hover:underline" href="#{id}">{title}</a>
  </h2>
  {@render children()}
</section>
