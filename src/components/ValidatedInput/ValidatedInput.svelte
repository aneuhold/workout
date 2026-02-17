<!--
  @component

  Wraps the base Input component with validation logic.
  Shows inline error feedback using the Input's existing `aria-invalid` styling
  and error text below the input when invalid.
  The parent always holds a valid value — invalid input only updates the display.
-->
<script lang="ts">
  import type { HTMLInputTypeAttribute } from 'svelte/elements';
  import Input from '$ui/Input/Input.svelte';

  let {
    /** The current valid value. Only updates when input passes validation. */
    value = $bindable<string | number>(''),
    /** HTML input type. Defaults to `'text'`. Determines which validation rules apply. */
    type = 'text',
    /** Minimum value for number inputs. */
    min,
    /** Maximum value for number inputs. */
    max,
    /** Step for number inputs. When `1` (default for number inputs), enforces integer validation. */
    step,
    /** Whether the field is required. Applies to all input types. */
    required = false,
    /** Minimum length for text-like inputs. */
    minlength,
    /** Maximum length for text-like inputs. */
    maxlength,
    /** Element id, for Label `for` attribute passthrough. */
    id,
    /** Placeholder text. */
    placeholder,
    /** Additional CSS classes passed through to the Input. */
    class: className,
    /** Whether the input is disabled. */
    disabled = false
  }: {
    value: string | number;
    type?: HTMLInputTypeAttribute;
    min?: number;
    max?: number;
    step?: number | 'any';
    required?: boolean;
    minlength?: number;
    maxlength?: number;
    id?: string;
    placeholder?: string;
    class?: string;
    disabled?: boolean;
  } = $props();

  /** What the user sees in the input field. */
  let displayValue = $state(String(value));

  /** Error message shown below the input when non-empty. */
  let errorMessage = $state('');

  function handleInput(event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    displayValue = raw;

    if (type === 'number') {
      validateNumber(raw);
    } else {
      validateText(raw);
    }
  }

  function validateNumber(raw: string) {
    if (raw.trim() === '') {
      if (required) {
        errorMessage = 'Required';
        return;
      }
      // Empty non-required: clear error but don't update value
      errorMessage = '';
      return;
    }

    const num = Number(raw);

    if (isNaN(num)) {
      errorMessage = 'Must be a number';
      return;
    }

    const isIntegerStep = step === undefined || step === 1;
    if (isIntegerStep && !Number.isInteger(num)) {
      errorMessage = 'Must be a whole number';
      return;
    }

    if (min !== undefined && num < min) {
      errorMessage = `Min ${min}`;
      return;
    }

    if (max !== undefined && num > max) {
      errorMessage = `Max ${max}`;
      return;
    }

    // Valid
    errorMessage = '';
    value = isIntegerStep ? parseInt(raw, 10) : parseFloat(raw);
  }

  function validateText(raw: string) {
    if (raw === '' && required) {
      errorMessage = 'Required';
      return;
    }

    if (minlength !== undefined && raw.length < minlength) {
      errorMessage = `Min ${minlength} characters`;
      return;
    }

    if (maxlength !== undefined && raw.length > maxlength) {
      errorMessage = `Max ${maxlength} characters`;
      return;
    }

    // Valid
    errorMessage = '';
    value = raw;
  }
</script>

<div class="flex flex-col gap-1">
  <Input
    {id}
    {type}
    {placeholder}
    class={className}
    value={displayValue}
    oninput={handleInput}
    aria-invalid={errorMessage ? 'true' : undefined}
    {min}
    {max}
    {step}
    {required}
    {minlength}
    {maxlength}
    {disabled}
  />
  {#if errorMessage}
    <p class="text-destructive text-xs">{errorMessage}</p>
  {/if}
</div>
