import type { ProjectWorkoutPrimaryEndpointOptions } from '@aneuhold/core-ts-api-lib';

/**
 * Standard `get` options that request refreshed exercise and muscle-group
 * volume CTOs after a mutation. Shared by every document map service whose
 * writes can affect CTO-derived fields.
 */
export const ctoGet: ProjectWorkoutPrimaryEndpointOptions['get'] = {
  exerciseCTOs: { all: true },
  muscleGroupVolumeCTOs: { all: true }
};
