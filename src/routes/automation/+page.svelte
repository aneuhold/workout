<!--
  @component
  
  A page for Automation tools.
-->
<script lang="ts">
  import Paper, { Content, Subtitle, Title } from '@smui/paper';
  import LinkList from '$components/LinkList.svelte';
  import type { LinkInfo } from '$components/LinkListItem.svelte';
  import PageTitle from '$components/PageTitle.svelte';
  import { dashboardConfig } from '$stores/local/dashboardConfig';
  import AutomationTrigger from './AutomationTrigger.svelte';
  import { automationPageInfo } from './pageInfo';

  const monitoringLinks: Array<LinkInfo> = [
    {
      title: 'Wyze',
      description: 'Wyze Cameras',
      clickAction: () => {
        window.open('https://my.wyze.com/live', '_blank');
      },
      iconName: 'videocam'
    }
  ];

  const automationConfiguration: Array<LinkInfo> = [
    {
      title: 'Voice Monkey',
      description: 'Trigger Alexa routines from anywhere that can send a web request',
      clickAction: () => {
        window.open('https://console.voicemonkey.io/api-v2/playground?api=trigger', '_blank');
      },
      iconName: 'smart_toy'
    }
  ];
</script>

<svelte:head>
  <title>{automationPageInfo.shortTitle}</title>
  <meta name="description" content={automationPageInfo.description} />
</svelte:head>

<PageTitle title={automationPageInfo.shortTitle} subtitle={automationPageInfo.description} />
<div class="content">
  <Paper>
    <Title>Actions</Title>
    <Subtitle>All of these actually trigger a thing to happen</Subtitle>
    <Content>
      <AutomationTrigger
        title="Bed Time + Watching Shows"
        description="Turns off all lights except the kitchen + garage. Also doesn't turn off the TV and blu-ray player."
        iconName="bedtime"
        automationTriggerUrl={$dashboardConfig?.automationUrls.bedTimeButStillWatchingShows}
      />
      <AutomationTrigger
        title="Bed Time"
        description="Turns off all lights, the TV and blu-ray player."
        iconName="bedtime"
        automationTriggerUrl={$dashboardConfig?.automationUrls.bedTime}
      />
      <AutomationTrigger
        title="Sunrise"
        description="Turns on everything for the most part except the bedroom light."
        iconName="sunny"
        automationTriggerUrl={$dashboardConfig?.automationUrls.sunrise}
      />
      <AutomationTrigger
        title="Toggle Sunlight"
        description="Toggles the sunlight upstairs off and on."
        iconName="brightness_5"
        automationTriggerUrl={$dashboardConfig?.automationUrls.sunLight}
      />
      <AutomationTrigger
        title="Zoom Lights"
        description="Turns off the sunlight + turns on upstairs lights 1 and 2."
        iconName="videocam"
        automationTriggerUrl={$dashboardConfig?.automationUrls.zoomLighting}
      />
    </Content>
  </Paper>
  <Paper>
    <Title>Monitoring</Title>
    <Content>
      <LinkList links={monitoringLinks} />
    </Content>
  </Paper>
  <Paper>
    <Title>Configuration</Title>
    <Content>
      <LinkList links={automationConfiguration} />
    </Content>
  </Paper>
</div>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
