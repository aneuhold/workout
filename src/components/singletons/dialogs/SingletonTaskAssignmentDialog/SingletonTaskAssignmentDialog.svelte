<!--
  @component
  
  This component is a singleton, and should only ever be used once. Use the
  exported functions to show the dialog.
-->
<script lang="ts" module>
  import Button, { Label } from '@smui/button';
  import Checkbox from '@smui/checkbox';
  import { Actions, Content, Title } from '@smui/dialog';
  import FormField from '@smui/form-field';
  import type { UUID } from 'crypto';
  import { writable } from 'svelte/store';
  import SmartDialog from '$components/presentational/SmartDialog.svelte';
  import taskMapService from '$services/Task/TaskMapService/TaskMapService';
  import { userConfig } from '$stores/local/userConfig/userConfig';

  /**
   * A task assignment dialog which can be used anywhere in the app.
   */
  export const taskAssignmentDialog = {
    open: (taskId: UUID) => {
      currentTaskId.set(taskId);
      open.set(true);
    }
  };

  const currentTaskId = writable<UUID | null>(null);
  const open = createOpenStore();

  function createOpenStore() {
    const { subscribe, set } = writable(false);

    return {
      subscribe,
      set: (value: boolean) => {
        if (value) {
          set(value);
        } else {
          // Reset the current task id when the dialog is closed. This helps
          // prevent errors if the task is deleted after the dialog is closed.
          currentTaskId.set(null);
          set(value);
        }
      }
    };
  }
</script>

<script lang="ts">
  let task = $derived($currentTaskId ? taskMapService.mapState[$currentTaskId] : null);
  let title = $derived(task?.title ?? 'Task Assignment');
  let sharedWithIds = $derived(task?.sharedWith ?? []);
  let collaborators = $derived($userConfig.collaborators);
  let sharedWithUsers = $derived([
    { _id: $userConfig.config.userId, userName: 'Me' },
    ...Object.values(collaborators).filter((collaborator) => {
      return sharedWithIds.includes(collaborator._id) || collaborator._id === task?.userId;
    })
  ]);

  function toggleAssignment(userId: UUID) {
    if (!task) return;
    taskMapService.updateDoc(task._id, (task) => {
      task.assignedTo = task.assignedTo === userId ? null : userId;
      return task;
    });
  }
</script>

<SmartDialog bind:open={$open}>
  {#if task}
    <Title>{title}</Title>
    <Content>
      <div class="content">
        {#if Object.values(collaborators).length === 0}
          <i class="mdc-typography--body1 dimmed-color">No collaborators</i>
          <a href="/settings">Add one in settings here!</a>
        {:else if sharedWithIds.length > 0}
          <span class="sectionTitle mdc-typography--body1">Assign To</span>
          {#each Object.values(sharedWithUsers) as sharedWithUser (sharedWithUser._id)}
            <FormField>
              <Checkbox
                checked={task.assignedTo === sharedWithUser._id}
                onclick={() => {
                  toggleAssignment(sharedWithUser._id);
                }}
              />
              {#snippet label()}
                <span>
                  {sharedWithUser.userName}
                </span>
              {/snippet}
            </FormField>
          {/each}
        {/if}
      </div>
    </Content>
    <Actions>
      <Button
        onclick={() => {
          $open = false;
        }}
      >
        <Label>Done</Label>
      </Button>
    </Actions>
  {/if}
</SmartDialog>

<style>
  .content {
    display: flex;
    flex-direction: column;
  }
  .sectionTitle {
    color: var(--mdc-theme-text-primary-on-background);
  }
</style>
