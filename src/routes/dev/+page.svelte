<!--
  @component
  
  A page for Development info.

  Implementation notes:
  - SVG icons: https://worldvectorlogo.com/
-->
<script lang="ts">
  import Paper, { Content as PaperContent, Title } from '@smui/paper';
  import LinkList from '$components/LinkList.svelte';
  import type { LinkInfo } from '$components/LinkListItem.svelte';
  import PageNotFound from '$components/PageNotFound.svelte';
  import PageTitle from '$components/PageTitle.svelte';
  import DigitalOceanIcon from '$lib/svgs/DigitalOceanIcon.svelte';
  import MongoDbIcon from '$lib/svgs/MongoDBIcon.svelte';
  import NetlifyIcon from '$lib/svgs/NetlifyIcon.svelte';
  import SentryIcon from '$lib/svgs/SentryIcon.svelte';
  import { userConfig } from '$stores/local/userConfig/userConfig';
  import navInfo from '$util/navInfo';
  import { devPageInfo } from './pageInfo';

  const architectureLinks: Array<LinkInfo> = [
    navInfo.devArch,
    {
      title: 'Sentry',
      description: 'Logging and error tracking. Login with GitHub account.',
      clickAction: () => {
        window.open('https://anton-neuhold.sentry.io/issues/?referrer=sidebar', '_blank');
      },
      icon: SentryIcon
    },
    {
      title: 'Netlify',
      description: 'Static site hosting',
      clickAction: () => {
        window.open('https://www.netlify.com/', '_blank');
      },
      icon: NetlifyIcon
    },
    {
      title: 'MongoDB Atlas',
      description: 'Cloud MongoDB Hosting. Login with Google account.',
      clickAction: () => {
        window.open('https://cloud.mongodb.com/v2/655933be7ffb754535fbb6af#/overview', '_blank');
      },
      icon: MongoDbIcon
    },
    {
      title: 'Digital Ocean',
      description: 'Cloud Hosting and Functions. Login with GitHub account.',
      clickAction: () => {
        window.open(
          'https://cloud.digitalocean.com/projects/286e35d0-0583-4d8c-8c70-bd3d0bca8aef/resources?i=228288',
          '_blank'
        );
      },
      icon: DigitalOceanIcon
    }
  ];

  const randomToolsLinks: Array<LinkInfo> = [
    {
      title: 'GitIgnore Generator',
      description: 'To generate .gitignore files',
      clickAction: () => {
        window.open('https://www.gitignore.io/', '_blank');
      },
      iconName: 'code'
    },
    {
      title: 'Simple Icon Generator',
      description: 'A really simple icon / logo generator',
      clickAction: () => {
        window.open('https://prefinem.com/simple-icon-generator/', '_blank');
      },
      iconName: 'brush'
    }
  ];
</script>

<svelte:head>
  <title>{devPageInfo.title}</title>
  <meta name="description" content={devPageInfo.title} />
</svelte:head>

{#if !$userConfig.config.enableDevMode}
  <PageNotFound />
{:else}
  <PageTitle title={devPageInfo.title} />

  <div class="content">
    <Paper>
      <Title>Architecture</Title>
      <PaperContent>
        <LinkList links={architectureLinks} />
      </PaperContent>
    </Paper>
    <Paper>
      <Title>Random Tools</Title>
      <PaperContent>
        <LinkList links={randomToolsLinks} />
      </PaperContent>
    </Paper>
  </div>
{/if}

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
