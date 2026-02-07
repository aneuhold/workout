<script lang="ts">
  import Button, { Icon } from '@smui/button';

  let {
    variant,
    disabled = false,
    color = 'primary',
    iconName,
    /**
     * Callback fired when the button is clicked.
     */
    onclick
  }: {
    variant?: 'outlined' | 'raised';
    disabled?: boolean;
    color?: 'primary' | 'secondary';
    iconName: string;
    /**
     * Callback fired when the button is clicked.
     */
    onclick?: () => void;
  } = $props();
</script>

<div>
  <Button {variant} {color} class="squareIconButton" {onclick} {disabled}>
    <Icon class="material-icons squareIconButtonIcon">{iconName}</Icon>
  </Button>
</div>

<style>
  * :global(.squareIconButtonIcon) {
    margin: 0px;
  }

  * :global(.squareIconButton) {
    min-width: 42px;
  }
</style>
