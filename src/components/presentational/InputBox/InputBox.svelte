<!--
  @component
  
  A basic input box component.

  - The `onsubmit` callback can be provided for when the user presses the "Enter" key.

  Note that the `onsubmit` callback is not required if the InputBox is contained
  in a `form` element, as that automatically happens in that case. No callback
  needed. The form will automatically trigger the onclick event of the
  nearest button.

  ### Implementation Notes

  There's also a global style added in the globalStyles folder for the text area
  to adjust it's min height.
-->
<script lang="ts">
  import Textfield from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text';
  import type { FullAutoFill } from 'svelte/elements';

  let {
    disable = false,
    inputType = 'text',
    min,
    max,
    isTextArea = false,
    label,
    onBlurValue = $bindable(''),
    inputValue = $bindable(onBlurValue),
    autocompleteLabel,
    helperText = null,
    variant = 'standard',
    spellCheck = true,
    isSmall = false,
    isValid = true,
    onSubmit,
    onBlur
  }: {
    disable?: boolean;
    /**
     * The input type for the `InputBox`.
     */
    inputType?: string;
    /**
     * The minimum value if the input type is a number.
     */
    min?: number | null;
    /**
     * The maximum value if the input type is a number.
     */
    max?: number | null;
    /**
     * Determines if the input is a text area instead of just a single line.
     */
    isTextArea?: boolean;
    /**
     * This will show in the input box as a label when the text is empty,
     * and move to the top when the user starts typing.
     */
    label?: string;
    /**
     * The value of the input box when the user blurs the input. This also acts
     * as the initial value. It will only be updated when the user leaves the
     * input box.
     */
    onBlurValue?: string | number | null;
    /**
     * The value of the `InputBox`. This will update automatically and can be
     * bound to. Alternatively, the onBlurValue can be bound to to only get
     * updates when the user blurs the input.
     */
    inputValue?: string | number | null;
    /**
     * If set, it will use the browser auto-complete features for the specified
     * label. For example `password`. If auto-complete is not desired, do not
     * set this.
     */
    autocompleteLabel?: FullAutoFill;
    /**
     * The helper text to show below the input box. If null, no helper text will
     * be shown.
     */
    helperText?: string | null;
    /**
     * Variant for when this is not a text area. If it is a text area, this will
     * be ignored.
     */
    variant?: 'filled' | 'outlined' | 'standard';
    /**
     * If false spell check will be disabled. Defaults to true.
     */
    spellCheck?: boolean;
    /**
     * If the input box should be small. This only applies to non-textarea
     * input boxes.
     */
    isSmall?: boolean;
    /**
     * Optional validation value that can be set. If it is set, the input box
     * will be invalid.
     */
    isValid?: boolean;
    /**
     * Callback fired when the user presses Enter (for non-textarea inputs).
     */
    onSubmit?: () => void;
    /**
     * Callback fired when the value is committed (on blur or enter).
     */
    onBlur?: (value: string | number | null) => void;
  } = $props();

  let previousOnBlurValue = $state(onBlurValue);

  /**
   * Indicates if the input has been touched and edited. Might be useful
   * later.
   */
  let dirty = $state(false);
  /**
   * Only used for number validation at the moment, but it's built to block
   * the onBlurValue from being updated if the input is invalid so could be
   * quite useful in the future.
   */
  let invalid = $derived(
    !isValid ||
      (typeof inputValue === 'number' &&
        (isNaN(inputValue) ||
          (min !== undefined && min !== null && inputValue < min) ||
          (max !== undefined && max !== null && inputValue > max)))
  );

  function handleKeyDown(event: CustomEvent | KeyboardEvent) {
    event = event as KeyboardEvent;
    if (event.key === 'Enter' && !isTextArea) {
      onBlurValue = inputValue;
      onSubmit?.();
      onBlur?.(inputValue);
    }
  }

  function handleBlur() {
    if (!invalid) {
      onBlurValue = inputValue;
      onBlur?.(inputValue);
    }
  }

  // Check if the onBlurValue is null or undefined and set it to an empty
  // string if it is. This fixes graphical issues with the input box.
  // Also detect when the onBlurValue is changed outside the component.
  $effect(() => {
    // Because we don't know what kind of value the backend is providing
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (onBlurValue === null || onBlurValue === undefined) {
      onBlurValue = '';
      previousOnBlurValue = onBlurValue;
      inputValue = onBlurValue;
    } else if (onBlurValue !== previousOnBlurValue && onBlurValue !== inputValue) {
      inputValue = onBlurValue;
      previousOnBlurValue = onBlurValue;
    } else if (onBlurValue !== previousOnBlurValue) {
      previousOnBlurValue = onBlurValue;
    }
  });
</script>

<Textfield
  type={inputType}
  bind:dirty
  bind:invalid
  disabled={disable}
  bind:value={inputValue}
  input$autocomplete={autocompleteLabel}
  input$resizable={isTextArea ? false : undefined}
  input$rows={isTextArea && typeof inputValue === 'string'
    ? inputValue.split(/\r\n|\r|\n/).length
    : undefined}
  input$min={min}
  input$max={max}
  input$spellcheck={spellCheck ? 'true' : 'false'}
  helperLine$class={helperText ? '' : 'display-none'}
  textarea={isTextArea}
  variant={isTextArea ? undefined : variant}
  {label}
  class={isSmall ? 'textField-small' : undefined}
  onkeydown={handleKeyDown}
  onblur={handleBlur}
>
  {#snippet helper()}
    {#if helperText}
      <HelperText persistent>{helperText}</HelperText>
    {/if}
  {/snippet}
</Textfield>

<style>
  :global(.textField-small) {
    width: 60px;
  }
</style>
