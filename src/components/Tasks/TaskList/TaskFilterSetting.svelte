<script lang="ts">
  import Card, { Content } from '@smui/card';
  import Checkbox from '@smui/checkbox';
  import ClickableDiv from '$components/presentational/ClickableDiv.svelte';

  let {
    settingName,
    enabled,
    onclick
  }: {
    settingName: string;
    enabled: boolean;
    onclick?: () => void;
  } = $props();

  let tagContentClass = $derived(enabled ? 'card-content colorWhite' : 'card-content dimmed-color');
</script>

<div>
  <Card variant="outlined">
    <Content class="tagRowContent">
      <ClickableDiv clickAction={() => onclick?.()}>
        <div class={tagContentClass}>
          <div class="iconSet leftIconSet">
            <Checkbox checked={enabled} touch class="tagCheckbox" />
          </div>
          <h4 class="mdc-typography--body1 text">
            {settingName}
          </h4>
        </div>
      </ClickableDiv>
    </Content>
  </Card>
</div>

<style>
  * :global(.tagRowContent) {
    padding: 0px;
  }
  * :global(.tagCheckbox) {
    margin: 0px;
  }
  .colorWhite {
    color: var(--mdc-theme-on-primary);
  }
  .text {
    margin-top: 4px;
    margin-bottom: 4px;
  }
  .card-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding-right: 8px;
  }
  .iconSet {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
  }
  .leftIconSet {
    margin-right: -4px;
  }
</style>
