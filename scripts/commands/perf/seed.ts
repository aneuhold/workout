import { APIService, type ProjectWorkoutPrimaryEndpointOptions } from '@aneuhold/core-ts-api-lib';
import { ProjectName } from '@aneuhold/core-ts-db-lib';
import { test } from 'vitest';
import equipmentTypeMapService from '$services/documentMapServices/EquipmentTypeMap.service.svelte';
import exerciseCalibrationMapService from '$services/documentMapServices/ExerciseCalibrationMap.service.svelte';
import exerciseMapService from '$services/documentMapServices/ExerciseMap.service.svelte';
import mesocycleMapService from '$services/documentMapServices/MesocycleMap.service.svelte';
import microcycleMapService from '$services/documentMapServices/MicrocycleMap.service.svelte';
import muscleGroupMapService from '$services/documentMapServices/MuscleGroupMap.service.svelte';
import sessionExerciseMapService from '$services/documentMapServices/SessionExerciseMap.service.svelte';
import sessionMapService from '$services/documentMapServices/SessionMap.service.svelte';
import setMapService from '$services/documentMapServices/SetMap.service.svelte';
import mockEnvSetupService from '$services/MockEnvSetupService/MockEnvSetup.service';
import MockScenarioService from '$services/MockScenarioService/MockScenario.service';
import { FullAppScenario } from '$services/MockScenarioService/types';
import perfTestUtils from '$testUtils/perfTestUtils';
import MockUsers from '$util/MockUsers';
import type { WorkoutApiInsertKey } from '$util/workoutPersistenceUtils';

/**
 * Seeds the perf user with the documents of the
 * `FullAppScenario.MidTrainingWithHistory` mock scenario. The account is only
 * wiped and reseeded when its document counts differ from the scenario's.
 */
test('seed perf user', async () => {
  mockEnvSetupService.setupGlobalMocks(true);

  const { username, password } = perfTestUtils.getPerfCreds();
  const auth = await APIService.validateUser({
    project: ProjectName.Workout,
    userName: username,
    password
  });
  if (!auth.success || !auth.data.accessToken || !auth.data.userInfo?.user) {
    throw new Error(`Auth failed: ${JSON.stringify(auth.errors)}`);
  }
  const authedUserId = auth.data.userInfo.user._id;
  APIService.setAccessToken(auth.data.accessToken);

  // The mock factories build documents with `MockUsers.currentUserCto._id`,
  // so point it at the perf user before generating the scenario.
  MockUsers.currentUserCto._id = authedUserId;
  MockScenarioService.setupScenario(FullAppScenario.MidTrainingWithHistory);

  const insertPayload: Required<NonNullable<ProjectWorkoutPrimaryEndpointOptions['insert']>> = {
    mesocycles: mesocycleMapService.allDocs,
    microcycles: microcycleMapService.allDocs,
    sessions: sessionMapService.allDocs,
    sessionExercises: sessionExerciseMapService.allDocs,
    sets: setMapService.allDocs,
    exercises: exerciseMapService.allDocs,
    exerciseCalibrations: exerciseCalibrationMapService.allDocs,
    muscleGroups: muscleGroupMapService.allDocs,
    equipmentTypes: equipmentTypeMapService.allDocs
  };

  /**
   * Type-guarded keys of `insertPayload`. `Object.keys` widens to `string[]`,
   * so we narrow with a predicate to keep the static union throughout.
   */
  const collectionKeys = Object.keys(insertPayload).filter(
    (key): key is WorkoutApiInsertKey => key in insertPayload
  );

  const getAllOptions: ProjectWorkoutPrimaryEndpointOptions = {
    get: Object.fromEntries(collectionKeys.map((key) => [key, { all: true }]))
  };
  const existing = await APIService.callWorkoutAPI({ options: getAllOptions });
  if (!existing.success) {
    throw new Error(`Failed to fetch existing docs: ${JSON.stringify(existing.errors)}`);
  }

  const expectedCounts = Object.fromEntries(
    collectionKeys.map((key) => [key, insertPayload[key].length])
  );
  const currentCounts = Object.fromEntries(
    collectionKeys.map((key) => [key, existing.data[key]?.length ?? 0])
  );
  console.log('Expected counts:', expectedCounts);
  console.log('Current counts:', currentCounts);
  if (collectionKeys.every((key) => currentCounts[key] === expectedCounts[key])) {
    console.log('Counts match expected. Skipping wipe + reinsert.');
    return;
  }
  console.log('Counts do not match. Wiping and reseeding.');

  const deletePayload: ProjectWorkoutPrimaryEndpointOptions['delete'] = Object.fromEntries(
    collectionKeys.map((key) => [key, (existing.data[key] ?? []).map((doc) => doc._id)])
  );

  const result = await APIService.callWorkoutAPI({
    options: { delete: deletePayload, insert: insertPayload }
  });
  if (!result.success) {
    throw new Error(`Seed failed: ${JSON.stringify(result.errors)}`);
  }
  console.log('Seed complete.');
}, 60_000);
