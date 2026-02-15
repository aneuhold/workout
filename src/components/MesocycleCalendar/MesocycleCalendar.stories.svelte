<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createNumberArgTypes, createTextArgTypes } from '$storybook/storybookUtil';
  import SBMesocycleCalendarExample from './SBMesocycleCalendarExample.svelte';

  const { Story } = defineMeta({
    title: 'Components/MesocycleCalendar',
    component: SBMesocycleCalendarExample,
    argTypes: {
      ...createNumberArgTypes('microcycleCount', 'microcycleLengthDays', 'completedSessionCount'),
      ...createTextArgTypes('restDays', 'startDate')
    },
    args: {
      microcycleCount: 6,
      microcycleLengthDays: 8,
      restDays: '0,6',
      startDate: '2026-02-15',
      completedSessionCount: 0,
      plannedSessionCountPerMicrocycle: 5
    }
  });
</script>

<Story name="Default Preview" />

<Story name="In-Progress Early" args={{ completedSessionCount: 5 }} />

<Story name="Eight-Day Microcycle" args={{ microcycleLengthDays: 8, restDays: '0,7' }} />

<Story name="Minimal Plan" args={{ microcycleCount: 2, microcycleLengthDays: 5, restDays: '4' }} />

<Story name="In-Progress Near Deload" args={{ completedSessionCount: 15 }} />

<Story name="In-Progress In Deload" args={{ completedSessionCount: 20 }} />
