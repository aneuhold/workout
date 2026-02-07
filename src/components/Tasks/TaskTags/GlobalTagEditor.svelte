<script lang="ts">
  import Button, { Label } from '@smui/button';
  import { Actions, Content, Title } from '@smui/dialog';
  import InputBox from '$components/presentational/InputBox/InputBox.svelte';
  import SmartDialog from '$components/presentational/SmartDialog.svelte';
  import TaskTagsService from '$services/Task/TaskTagsService';
  import { userConfig } from '$stores/local/userConfig/userConfig';

  let {
    open = $bindable(false),
    /**
     * The tag name to update. If not provided, the editor will be in "add" mode.
     */
    tagName
  }: {
    open?: boolean;
    /**
     * The tag name to update. If not provided, the editor will be in "add" mode.
     */
    tagName?: string;
  } = $props();

  function handleCancel() {
    open = false;
  }
  function handleDone() {
    if (tagEditorValue !== tagName) {
      if (tagName) {
        TaskTagsService.updateTag(tagName, tagEditorValue);
      } else {
        TaskTagsService.addTagForUser(tagEditorValue);
      }
    }
    open = false;
  }

  function validateTagEditorValue(value: string) {
    if (tagEditorValue === '') return false;
    return tagEditorValue === tagName || !$userConfig.config.tagSettings[value];
  }
  let tagEditorValue = $derived(tagName ?? '');
  let tagValueIsValid = $derived(validateTagEditorValue(tagEditorValue));
  let buttonIsDisabled = $derived(!tagValueIsValid || tagEditorValue === tagName);
  let tagEditorTitle = $derived(tagName ? `Edit "${tagName}" Tag` : 'Add New Tag');
</script>

<SmartDialog bind:open>
  <Title>{tagEditorTitle}</Title>
  <Content>
    <InputBox label="Tag Name" isValid={tagValueIsValid} bind:inputValue={tagEditorValue} />
  </Content>
  <Actions>
    <Button onclick={handleCancel}>
      <Label>Cancel</Label>
    </Button>
    <Button onclick={handleDone} disabled={buttonIsDisabled}>
      <Label>Done</Label>
    </Button>
  </Actions>
</SmartDialog>
