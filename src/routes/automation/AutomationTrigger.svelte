<script lang="ts">
  import Button, { Label } from '@smui/button';
  import Card, { Content } from '@smui/card';
  import { Icon } from '@smui/icon-button';
  import { snackbar } from '$components/singletons/SingletonSnackbar.svelte';

  let {
    iconName,
    title,
    description,
    automationTriggerUrl
  }: {
    iconName: string;
    title: string;
    description: string;
    automationTriggerUrl: string | undefined;
  } = $props();

  function handleButtonClick() {
    if (automationTriggerUrl) {
      fetch(automationTriggerUrl).then((response) => {
        if (response.ok) {
          snackbar.success('Automation Triggered', 4000);
        } else {
          snackbar.error('Failed to trigger automation');
        }
      });
    }
  }
</script>

<div class="container">
  <Card variant="outlined">
    <Content>
      <div class="card-content">
        <Icon class="material-icons">{iconName}</Icon>
        <div class="action-container">
          {#if automationTriggerUrl}
            <Button variant="raised" onclick={handleButtonClick}>
              <Label>{title}</Label>
            </Button>
          {/if}
          <h4 class="mdc-typography--body1 title">
            {description}
          </h4>
        </div>
      </div>
    </Content>
  </Card>
</div>

<style>
  .container {
    padding: 2px;
  }
  .card-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }
  .action-container {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  h4 {
    margin-top: 8px;
    margin-bottom: 0;
  }
</style>
