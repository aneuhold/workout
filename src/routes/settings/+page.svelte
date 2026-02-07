<!--
  @component
  
  A page for settings of the dashboard for the current user.
-->
<script lang="ts">
  import Button from '@smui/button';
  import Checkbox from '@smui/checkbox';
  import Chip, { Set, Text, TrailingAction } from '@smui/chips';
  import CircularProgress from '@smui/circular-progress';
  import FormField from '@smui/form-field';
  import Paper, { Content } from '@smui/paper';
  import PageTitle from '$components/PageTitle.svelte';
  import InputBox from '$components/presentational/InputBox/InputBox.svelte';
  import { triggerConfetti } from '$components/singletons/Confetti/Confetti.svelte';
  import { snackbar } from '$components/singletons/SingletonSnackbar.svelte';
  import TaskDeletionSettings from '$components/Tasks/TaskDeletionSettings.svelte';
  import GlobalTagSettings from '$components/Tasks/TaskTags/GlobalTagSettings.svelte';
  import { userConfig } from '$stores/local/userConfig/userConfig';
  import DashboardAPIService from '$util/api/DashboardAPIService';
  import { settingsPageInfo } from './pageInfo';

  let searchingForUser = $state(false);
  let userNameSearchValue = $state('');
  let previousUseConfetti = $userConfig.config.enabledFeatures.useConfettiForTasks;

  let collaboratorUserNames = $derived(
    Object.values($userConfig.collaborators).map((userCto) => userCto.userName)
  );

  function handleSearchForUser() {
    if (userNameSearchValue === '') return;
    searchingForUser = true;
    DashboardAPIService.checkIfUsernameIsValid(userNameSearchValue).then((userCto) => {
      if (userCto) {
        userConfig.addCollaborator(userCto);
        snackbar.success(`User ${userCto.userName} added to collaborators ✨`);
      } else {
        snackbar.error('User not found');
      }
      searchingForUser = false;
    });
  }

  function handleCollaboratorRemoval(event: CustomEvent<{ chipId: string }>) {
    userConfig.removeCollaborator(event.detail.chipId);
  }

  function handleEnableConfetti(event: MouseEvent | PointerEvent) {
    if (!previousUseConfetti) {
      if (event instanceof PointerEvent || event instanceof MouseEvent) {
        triggerConfetti(event.clientX, event.clientY);
      }
      previousUseConfetti = true;
    } else {
      previousUseConfetti = false;
    }
  }
</script>

<svelte:head>
  <title>{settingsPageInfo.shortTitle}</title>
  <meta name="description" content={settingsPageInfo.description} />
</svelte:head>

<PageTitle title={settingsPageInfo.shortTitle} subtitle={settingsPageInfo.description} />

<div class="container">
  <Paper>
    <Content>
      <div class="content">
        <h6 class="sectionTitle mdc-typography--subtitle1">General Settings</h6>
        <FormField>
          <Checkbox bind:checked={$userConfig.config.enableDevMode} touch />
          {#snippet label()}
            <span>
              Enable dev mode
              <span class="mdc-theme--text-hint-on-background checkBoxText">
                Enables some development features on the site
              </span>
            </span>
          {/snippet}
        </FormField>
        <FormField>
          <Checkbox bind:checked={$userConfig.config.enabledFeatures.catImageOnHomePage} touch />
          {#snippet label()}
            <span>
              Enable cat image on home page 🐈
              <span class="mdc-theme--text-hint-on-background checkBoxText">
                Just adds a random cat image to the home page
              </span>
            </span>
          {/snippet}
        </FormField>
        <hr class="sectionSeparator" />
        <h6 class="sectionTitle mdc-typography--subtitle1">Collaborators</h6>
        <div class="collaboratorsContainer">
          <Set chips={collaboratorUserNames} input onSMUIChipRemoval={handleCollaboratorRemoval}>
            {#snippet chip(chip)}
              <Chip {chip}>
                <Text>{chip}</Text>
                <TrailingAction icon$class="material-icons">cancel</TrailingAction>
              </Chip>
            {/snippet}
          </Set>

          <div class="userNameSearch">
            <div>
              <InputBox
                bind:inputValue={userNameSearchValue}
                disable={searchingForUser}
                spellCheck={false}
                helperText="Enter a username to search"
                label="Username"
                onSubmit={handleSearchForUser}
              />
            </div>
            <Button
              variant="raised"
              disabled={searchingForUser || userNameSearchValue === ''}
              onclick={handleSearchForUser}
            >
              {#if searchingForUser}
                <CircularProgress style="height: 32px; width: 32px;" indeterminate={true} />
              {:else}
                Search for User
              {/if}
            </Button>
          </div>
        </div>
        <hr class="sectionSeparator" />
        <div class="globalTagSettingsContainer">
          <GlobalTagSettings />
        </div>
        <hr class="sectionSeparator" />
        <FormField>
          <Checkbox
            bind:checked={$userConfig.config.enabledFeatures.useConfettiForTasks}
            onclick={handleEnableConfetti}
            touch
          />
          {#snippet label()}
            <span>Enable confetti for tasks</span>
          {/snippet}
        </FormField>
        <hr class="sectionSeparator" />
        <TaskDeletionSettings />
      </div>
    </Content>
  </Paper>
</div>

<style>
  .content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .sectionTitle {
    margin-bottom: 0px;
    margin-top: 0px;
    margin-left: 8px;
  }
  .sectionSeparator {
    width: 100%;
    border-color: darkgray;
  }
  .collaboratorsContainer {
    width: 100%;
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
  }
  .globalTagSettingsContainer {
    width: 100%;
  }
  .userNameSearch {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-left: 8px;
  }
  .container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 80px;
  }
  .checkBoxText {
    margin-left: 8px;
  }
</style>
