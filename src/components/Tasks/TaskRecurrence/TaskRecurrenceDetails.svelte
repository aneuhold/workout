<!--
  @component
  
  The details of recurrence on a task. This should currently only be used in
  the `TaskRecurrenceInfo` component.
-->
<script lang="ts">
  import {
    type DashboardTask,
    RecurrenceBasis,
    RecurrenceEffect,
    RecurrenceFrequencyType,
    type RecurrenceInfo
  } from '@aneuhold/core-ts-db-lib';
  import { DateService } from '@aneuhold/core-ts-lib';
  import Select, { Option } from '@smui/select';
  import { type Updater, writable } from 'svelte/store';
  import InputBox from '$components/presentational/InputBox/InputBox.svelte';
  import { confirmationDialog } from '$components/singletons/dialogs/SingletonConfirmationDialog/SingletonConfirmationDialog.svelte';
  import WeekdaySegmentedButton from '$components/WeekdaySegmentedButton.svelte';
  import taskMapService from '$services/Task/TaskMapService/TaskMapService';
  import TaskRecurrenceService from '$services/Task/TaskRecurrenceService.svelte';
  import TaskRecurrenceInfoIcon from './TaskRecurrenceInfoIcon.svelte';
  import TaskRecurrenceUpdateExample from './TaskRecurrenceUpdateExample.svelte';
  import TaskRecurrenceWeekdayOfMonth from './TaskRecurrenceWeekdayOfMonth.svelte';

  let {
    task,
    defaultRecurrenceInfo
  }: {
    task: DashboardTask;
    /**
     * The default recurrence info to use if the task has none.
     */
    defaultRecurrenceInfo: RecurrenceInfo;
  } = $props();

  let parentRecurringTaskInfo = $derived(task.parentRecurringTaskInfo);
  let disabled = $derived(!task.recurrenceInfo || !!parentRecurringTaskInfo);
  let startDate = $derived(task.startDate);
  let dueDate = $derived(task.dueDate);
  let exampleOfRecurrence = $derived(
    TaskRecurrenceService.createExampleOfRecurrence(
      task.recurrenceInfo ?? defaultRecurrenceInfo,
      startDate,
      dueDate,
      parentRecurringTaskInfo
    )
  );

  /**
   * The store that contains the recurrence info being edited or viewed.
   *
   * This purposefully re-runs every time the recurrence info is updated. It handles that issue
   * just fine. The main purpose behind the approach is to reset whenever the current task being
   * viewed changes, or the recurrence info is changed externally or the task is disabled / enabled
   * (which means the recurrence info was added / deleted all together).
   */
  let rInfo = $derived(createRInfoStore(task.recurrenceInfo ?? defaultRecurrenceInfo));

  /**
   * This is purposefully re-ran on every render.
   *
   * @param initialRInfo The initial recurrence info to base the store on.
   */
  function createRInfoStore(initialRInfo: RecurrenceInfo) {
    let currentFrequencyType = initialRInfo.frequency.type;
    let previousRInfoString = JSON.stringify(initialRInfo);
    const { set, subscribe } = writable(initialRInfo);

    function setRInfo(newRInfo: RecurrenceInfo, checkDate = true) {
      const newRInfoString = JSON.stringify(newRInfo);

      // Only update if something actually changed. This is needed because it seems a few SMUI
      // components kick off change detections even when the value is the same.
      if (newRInfoString === previousRInfoString) {
        return;
      }
      if (newRInfo.frequency.type !== currentFrequencyType) {
        handleTypeChange(newRInfo);
      }
      currentFrequencyType = newRInfo.frequency.type;
      if (checkDate && updateWouldTriggerRecurrence(newRInfo)) {
        return;
      }
      previousRInfoString = newRInfoString;
      set(newRInfo);

      // Only set it when the task has recurrence info. Initially adding recurrence info is
      // handled elsewhere.
      if (task.recurrenceInfo) {
        taskMapService.updateTaskRecurrenceOrDates(task._id, { newRecurrenceInfo: newRInfo });
      }
    }
    return {
      subscribe,
      set: (value: RecurrenceInfo) => {
        setRInfo(value);
      },
      update: (value: RecurrenceInfo, updater: Updater<RecurrenceInfo>) => {
        const newRInfo = updater(value);
        setRInfo(newRInfo);
      },
      setWithoutCheck(value?: RecurrenceInfo) {
        setRInfo(value ?? (JSON.parse(previousRInfoString) as RecurrenceInfo), false);
      }
    };
  }

  function updateWouldTriggerRecurrence(newRInfo: RecurrenceInfo): boolean {
    const simulatedDate = TaskRecurrenceService.getSimulatedRecurrenceDate(task, (task) => {
      task.recurrenceInfo = newRInfo;
      return task;
    });
    if (simulatedDate && simulatedDate < new Date()) {
      confirmationDialog.open({
        title: 'Are you sure?',
        message:
          `This update would case the next recurrence date to be ` +
          `${DateService.getDateTimeString(simulatedDate)} which is before now. ` +
          `This will cause the task to be updated immediately.` +
          `Are you sure you want to do this?`,
        onConfirm: () => {
          rInfo.setWithoutCheck(newRInfo);
        },
        onCancel: () => {
          rInfo.setWithoutCheck();
        }
      });
      return true;
    }
    return false;
  }

  function handleTypeChange(newRInfo: RecurrenceInfo) {
    switch (newRInfo.frequency.type) {
      case RecurrenceFrequencyType.everyXTimeUnit:
        newRInfo.frequency.everyXTimeUnit = {
          timeUnit: 'week',
          x: 1
        };
        break;
      case RecurrenceFrequencyType.weekDaySet:
        newRInfo.frequency.weekDaySet = [];
        break;
      case RecurrenceFrequencyType.everyXWeekdayOfMonth:
        newRInfo.frequency.everyXWeekdayOfMonth = {
          weekDay: 1,
          weekOfMonth: 1
        };
        break;
      case RecurrenceFrequencyType.lastDayOfMonth:
        break;
    }
    clearOtherTypes(newRInfo);
  }

  function clearOtherTypes(newRInfo: RecurrenceInfo) {
    Object.keys(newRInfo.frequency).forEach((key) => {
      // Little hacky, but does the job
      if (key !== (newRInfo.frequency.type as unknown as string) && key !== 'type') {
        (newRInfo.frequency as { [key: string]: unknown })[key] = undefined;
      }
    });
  }
</script>

<div class={disabled ? ' dimmed-color' : ''}>
  <div class="content">
    <div class="flexRowWrap">
      <b>Frequency</b>
      <TaskRecurrenceInfoIcon />
    </div>
    <Select {disabled} bind:value={$rInfo.frequency.type}>
      <Option value={RecurrenceFrequencyType.everyXTimeUnit}>Every X Time Unit</Option>
      <Option value={RecurrenceFrequencyType.weekDaySet}>Every Set of Weekdays</Option>
      <Option value={RecurrenceFrequencyType.everyXWeekdayOfMonth}>Every X Weekday of Month</Option>
      <Option value={RecurrenceFrequencyType.lastDayOfMonth}>Last Day of Every Month</Option>
    </Select>
    {#if $rInfo.frequency.everyXTimeUnit}
      <div class="flexRowWrap">
        <span>Recurring every</span>
        <InputBox
          inputType="number"
          min={1}
          isSmall
          disable={disabled}
          bind:onBlurValue={$rInfo.frequency.everyXTimeUnit.x}
        />
        <Select {disabled} bind:value={$rInfo.frequency.everyXTimeUnit.timeUnit}>
          <Option value="day">Days</Option>
          <Option value="week">Weeks</Option>
          <Option value="month">Months</Option>
          <Option value="year">Years</Option>
        </Select>
      </div>
    {:else if $rInfo.frequency.weekDaySet}
      <WeekdaySegmentedButton {disabled} bind:weekDaySetOrChoice={$rInfo.frequency.weekDaySet} />
    {:else if $rInfo.frequency.everyXWeekdayOfMonth}
      <TaskRecurrenceWeekdayOfMonth
        bind:weekDay={$rInfo.frequency.everyXWeekdayOfMonth.weekDay}
        bind:weekOfMonth={$rInfo.frequency.everyXWeekdayOfMonth.weekOfMonth}
      />
    {/if}
  </div>
  <hr />
  <div class="content">
    <div class="flexRowWrap">
      <b>Basis</b>
      <TaskRecurrenceInfoIcon />
    </div>
    {#if !startDate && !dueDate && !parentRecurringTaskInfo}
      <span class="mdc-typography--body2 dimmed-color">
        A start date or a due date must be set to pick a basis
      </span>
    {:else}
      <Select disabled={disabled || !startDate || !dueDate} bind:value={$rInfo.recurrenceBasis}>
        <Option value={RecurrenceBasis.startDate}>Start Date</Option>
        <Option value={RecurrenceBasis.dueDate}>Due Date</Option>
      </Select>
    {/if}
  </div>
  <hr />
  <div class="content extraMarginBottom">
    <div class="flexRowWrap">
      <b>Effect</b>
      <TaskRecurrenceInfoIcon />
    </div>
    <Select {disabled} bind:value={$rInfo.recurrenceEffect}>
      <Option value={RecurrenceEffect.rollOnBasis}>Roll on Basis</Option>
      <Option value={RecurrenceEffect.rollOnCompletion}>Roll on Completion</Option>
      <Option value={RecurrenceEffect.stack}>Stack</Option>
    </Select>
    <div>
      <span>Updates on next task recurrence:</span>
      {#if $rInfo.recurrenceEffect === RecurrenceEffect.stack && !task.completed}
        <ul>
          <li>This task</li>
          <ul>
            <TaskRecurrenceUpdateExample recurrenceIsRemoved={true} />
          </ul>
          <li>New Task</li>
          <ul>
            <TaskRecurrenceUpdateExample
              recurrenceIsAdded={true}
              newStartDate={exampleOfRecurrence.startDate}
              newDueDate={exampleOfRecurrence.dueDate}
            />
          </ul>
        </ul>
      {:else}
        <ul>
          <TaskRecurrenceUpdateExample
            originalStartDate={startDate}
            newStartDate={exampleOfRecurrence.startDate}
            originalDueDate={dueDate}
            newDueDate={exampleOfRecurrence.dueDate}
            completedRemoved={task.completed}
          />
        </ul>
      {/if}
    </div>
  </div>
</div>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 24px;
  }
  .flexRowWrap {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .extraMarginBottom {
    margin-bottom: 8px;
  }
  hr {
    width: 100%;
    border-color: var(--mdc-theme-secondary);
  }
</style>
