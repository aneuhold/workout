<script lang="ts" module>
  export type BreadCrumbArray = Array<{
    name: string;
    /**
     * The link to the route, this should not include the first slash.
     */
    link: string;
  }>;
</script>

<script lang="ts">
  import { page } from '$app/state';

  let {
    breadCrumbArray = null
  }: {
    breadCrumbArray?: BreadCrumbArray | null;
  } = $props();

  let activeRoute = $derived(page.route.id ?? '/');
  let routeArray = $derived(
    breadCrumbArray ? breadCrumbArray : buildActiveRouteSegments(activeRoute)
  );

  function buildActiveRouteSegments(routeString: string) {
    let previousLink: string | undefined;
    return routeString
      .split('/')
      .filter((route) => route !== '')
      .map((route) => {
        const routeLink = previousLink ? previousLink + '/' + route : route;
        previousLink = routeLink;
        return { name: route, link: routeLink };
      });
  }
</script>

<span class="breadcrumb-container">
  {#if routeArray.length === 0}
    <span>home</span>
  {:else}
    <a href="/">home</a>
    <span>/</span>
  {/if}
  {#each routeArray as route, index (route.link)}
    {#if index > 0}
      <span>/</span>
    {/if}
    {#if index === routeArray.length - 1}
      <span>{route.name}</span>
    {:else}
      <a href="/{route.link}">{route.name}</a>
    {/if}
  {/each}
</span>

<style>
  .breadcrumb-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-left: 8px;
    & > a {
      text-decoration: none;
      color: var(--mdc-theme-primary);
      &:hover {
        text-decoration: underline;
      }
    }
  }
</style>
