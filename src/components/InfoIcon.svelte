<!--
  An info icon that opens a dialog with the given title and content when clicked. 

  The content is passed as the default slot.

  ### Implementation Note

  This purposefully wasn't built as a tooltip because the UI is so dense in
  this application, that a tooltip could promote accidental clicking. Also
  the tooltip had some strange overflow issues. Those could have been resolved,
  but a Dialog seemed better.
-->
<script lang="ts">
  import Button, { Label } from '@smui/button';
  import { Actions, Content, Title } from '@smui/dialog';
  import IconButton, { Icon } from '@smui/icon-button';
  import type { Snippet } from 'svelte';
  import SmartDialog from './presentational/SmartDialog.svelte';

  let { title, children }: { title: string; children?: Snippet } = $props();

  let open = $state(false);
</script>

<IconButton
  onclick={() => {
    open = true;
  }}
  size="button"
>
  <Icon class="material-icons dimmed-color">help_outline</Icon>
</IconButton>

<SmartDialog bind:open>
  <!-- Title cannot contain leading whitespace due to mdc-typography-baseline-top() -->
  <Title>{title}</Title>
  <Content>{@render children?.()}</Content>
  <Actions>
    <Button
      onclick={() => {
        open = false;
      }}
    >
      <Label>Cool!</Label>
    </Button>
  </Actions>
</SmartDialog>
