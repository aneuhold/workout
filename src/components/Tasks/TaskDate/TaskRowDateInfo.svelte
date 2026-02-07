<script lang="ts">
  import { type DashboardTask } from '@aneuhold/core-ts-db-lib';
  import { DateService } from '@aneuhold/core-ts-lib';

  let { task }: { task: DashboardTask } = $props();
  let pastDue = $derived(task.dueDate && task.dueDate < new Date());
</script>

<div class="container no-before mdc-typography--caption mdc-theme--text-hint-on-background">
  {#if task.startDate}
    <span class="date">Starts: {DateService.getDateString(task.startDate)}</span>
  {:else}
    <!--Empty div to ensure the due date is always on the right-->
    <div></div>
  {/if}
  {#if task.dueDate}
    <span class={`date${pastDue ? ' pastDue' : ''}`}>
      Due: {DateService.getDateString(task.dueDate)}
    </span>
  {/if}
</div>

<style>
  .container {
    display: flex;
    flex-direction: row;
    width: 100%;
    gap: 4px;
    justify-content: space-between;
    flex-wrap: wrap;
  }
  .pastDue {
    color: var(--mdc-theme-error);
  }
  .date {
    border: 1px solid var(--mdc-theme-text-hint-on-background);
    padding: 0px 4px;
    border-radius: 8px;
  }
</style>
