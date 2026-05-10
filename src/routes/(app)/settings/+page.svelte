<script lang="ts">
  import SettingsPage from '$pages/SettingsPage/SettingsPage.svelte';
  import { settingsPageInfo } from './pageInfo';
</script>

<svelte:head>
  <title>{settingsPageInfo.shortTitle}</title>
  <meta name="description" content={settingsPageInfo.description} />
</svelte:head>

<SettingsPage />
