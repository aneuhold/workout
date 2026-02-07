<script lang="ts">
  import Button from '@smui/button';
  import { flip } from 'svelte/animate';
  import InfoIcon from '$components/InfoIcon.svelte';
  import { userConfig } from '$stores/local/userConfig/userConfig';
  import GlobalTagEditor from './GlobalTagEditor.svelte';
  import GlobalTagRow from './GlobalTagRow.svelte';

  let tagSettings = $derived($userConfig.config.tagSettings);
  let sortableTagList = $derived(
    Object.keys(tagSettings)
      .filter((tagName) => {
        return tagSettings[tagName]?.priority !== 0;
      })
      .sort((a, b) => {
        return tagSettings[b]?.priority ?? 0 - (tagSettings[a]?.priority ?? 0);
      })
  );
  let nonSortableTagList = $derived(
    Object.keys(tagSettings).filter((tagName) => {
      return tagSettings[tagName]?.priority === 0;
    })
  );

  let editorOpen = $state(false);
  let editorOpenForTag: string | undefined = $state('');

  function handleOpenEditor(tagName: string) {
    editorOpenForTag = tagName;
    editorOpen = true;
  }
</script>

<div class="container">
  <div class="titleContainer">
    <span class="mdc-typography--subtitle1 title">Global Task Tag Settings</span>
    <InfoIcon title="Global Tags">
      <p>Tags can be edited, have priorities added to them, and have priorities adjusted.</p>
      <ul>
        <li>
          <b>Tag editing</b>: Tags can be edited by clicking the options next to the tag name.
          Updating a tag name will update that tag name across all tasks.
        </li>
        <li>
          <b>Adding Priority to a Tag</b>: Tags can have priorities added to them by clicking the
          options and then "Add Priority". This will make it so that tags can be sorted according to
          your preferences. Tags will be grouped as well according to their priority when Tags are
          chosen as the first sorting option when viewing a task list.
        </li>
        <li>
          <b>Adjusting Priority on Tags</b>: If a priority has been added to a tag, then it's
          priority can be adjusted by clicking the arrows next to a tag's name.
          <uL>
            <li>
              When sorting by tags <i>descending</i>, the higher the priority number, the further up
              the list they will be.
            </li>
            <li>
              When sorting by tags <i>ascending</i>, the higher the priority number, the lower down
              list they will be.
            </li>
          </uL>
        </li>
      </ul>
    </InfoIcon>
  </div>

  {#each sortableTagList as tagName (tagName)}
    <div animate:flip={{ duration: 300 }}>
      <GlobalTagRow
        maxPriority={sortableTagList.length}
        {tagName}
        onOpenEditor={handleOpenEditor}
      />
    </div>
  {/each}
  {#each nonSortableTagList as tagName (tagName)}
    <GlobalTagRow maxPriority={sortableTagList.length} {tagName} onOpenEditor={handleOpenEditor} />
  {/each}
  <div class="addTagButtonContainer">
    <Button
      variant="outlined"
      onclick={() => {
        editorOpenForTag = undefined;
        editorOpen = true;
      }}>Add New Tag</Button
    >
  </div>
</div>

<GlobalTagEditor tagName={editorOpenForTag} bind:open={editorOpen} />

<style>
  .container {
    display: flex;
    flex-direction: column;
    margin: 0px 8px;
    gap: 4px;
  }
  .title {
    margin-bottom: 4px;
  }
  .titleContainer {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .addTagButtonContainer {
    display: flex;
    margin-top: 16px;
    justify-content: center;
  }
</style>
