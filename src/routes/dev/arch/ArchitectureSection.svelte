<!--
  @component

  A section of architecture items, for example "Frontend" or "Frontend Testing".
-->
<script lang="ts">
  import Paper, { Content, Subtitle, Title } from '@smui/paper';
  import type { ArchitectureContextComponent } from '../../../util/ArchitectureInfo/architectureContextInfo';
  import ArchitectureItemCard from './ArchitectureItemCard.svelte';

  let {
    title,
    subtitle = null,
    components
  }: {
    title: string;
    subtitle?: string | null;
    components: ArchitectureContextComponent[];
  } = $props();
</script>

<Paper>
  <Title>{title}</Title>
  {#if subtitle}
    <Subtitle>{subtitle}</Subtitle>
  {/if}
  <Content>
    {#each components as { component, contextSpecificDescription } (component.title)}
      <ArchitectureItemCard archComponent={component}>
        {#if contextSpecificDescription}
          <span><b>Context Specific Description:</b> {contextSpecificDescription}</span>
        {/if}
        {#if component.generalDescription && contextSpecificDescription}
          <br /><br />
        {/if}
        {#if component.generalDescription}
          <span>{component.generalDescription}</span>
        {/if}
      </ArchitectureItemCard>
    {/each}
  </Content>
</Paper>
