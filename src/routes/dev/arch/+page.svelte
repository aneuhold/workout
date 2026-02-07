<!--
  @component
  
  A page for Architecture info.

  Implementation notes:
  - SVG icons: https://worldvectorlogo.com/
-->
<script lang="ts" module>
</script>

<script lang="ts">
  import IconButton from '@smui/icon-button';
  import List, { Item, PrimaryText, SecondaryText, Text } from '@smui/list';
  import Paper, { Content as PaperContent, Subtitle, Title } from '@smui/paper';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import PageTitle from '$components/PageTitle.svelte';
  import architectureContextInfo from '$util/ArchitectureInfo/architectureContextInfo';
  import ArchitectureInfo from '$util/ArchitectureInfo/ArchitectureInfo';
  import ArchitectureSection from './ArchitectureSection.svelte';
  import { archPageInfo } from './pageInfo';

  let archContext = $derived(ArchitectureInfo.getContextFromSearchParams(page.url.searchParams));
</script>

<svelte:head>
  <title>{archPageInfo.shortTitle}</title>
  <meta name="description" content={archPageInfo.title} />
</svelte:head>

<PageTitle title={archPageInfo.shortTitle} subtitle="Architecture for various project types" />

{#if archContext === null}
  <Paper>
    <Title>Architecture Contexts</Title>
    <PaperContent>
      <p>
        Architecture contexts are different types of projects that you have built or are building.
      </p>
      <List twoLine={true}>
        {#each Object.entries(architectureContextInfo) as [contextName, contextInfo] (contextName)}
          <Item onclick={() => goto(`?context=${contextName}`)}>
            <Text>
              <PrimaryText>{contextInfo.title}</PrimaryText>
              <SecondaryText>{contextInfo.description}</SecondaryText>
            </Text>
          </Item>
        {/each}
      </List>
    </PaperContent>
  </Paper>
{/if}

{#if archContext !== null}
  <Paper variant="outlined">
    <Title>
      <div class="arch-context-title">
        {archContext.title}
        <IconButton
          class="material-icons"
          onclick={() => {
            goto('/dev/arch');
          }}
        >
          arrow_back
        </IconButton>
      </div>
    </Title>
    {#if archContext.description}
      <Subtitle>
        {archContext.description}
      </Subtitle>
    {/if}
    <PaperContent>
      {#if archContext.frontendComponents}
        <ArchitectureSection
          title="Frontend"
          subtitle="Architecture for the frontend part of the project"
          components={archContext.frontendComponents}
        />
      {/if}
      {#if archContext.frontendTestingComponents}
        <ArchitectureSection
          title="Frontend Testing"
          subtitle="Architecture for the frontend testing portion of the project"
          components={archContext.frontendTestingComponents}
        />
      {/if}
      {#if archContext.backendComponents}
        <ArchitectureSection
          title="Backend"
          subtitle="Architecture for the backend part of the project"
          components={archContext.backendComponents}
        />
      {/if}
      {#if archContext.backendTestingComponents}
        <ArchitectureSection
          title="Backend Testing"
          subtitle="Architecture for the backend testing portion of the project"
          components={archContext.backendTestingComponents}
        />
      {/if}
      {#if archContext.devOpsComponents}
        <ArchitectureSection
          title="DevOps"
          subtitle="Architecture for the DevOps part of the project"
          components={archContext.devOpsComponents}
        />
      {/if}
    </PaperContent>
  </Paper>
{/if}

<style>
  .arch-context-title {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
</style>
