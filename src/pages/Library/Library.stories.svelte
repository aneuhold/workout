<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Library from './Library.svelte';
  import { mockEquipment, mockExercises, mockMuscleGroups } from './mockData';

  const { Story } = defineMeta({
    title: 'Pages/Library',
    component: Library,
    parameters: {
      layout: 'fullscreen'
    },
    args: {
      exercises: mockExercises,
      muscleGroups: mockMuscleGroups,
      equipment: mockEquipment
    }
  });
</script>

<Story name="Default" />

<Story
  name="Empty Library"
  args={{
    exercises: [],
    muscleGroups: [],
    equipment: []
  }}
/>
