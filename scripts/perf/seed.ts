import { APIService, type ProjectWorkoutPrimaryEndpointOptions } from '@aneuhold/core-ts-api-lib';
import { ProjectName } from '@aneuhold/core-ts-db-lib';
import { test, vi } from 'vitest';
import MesocycleMapServiceMock from '$services/documentMapServices/mesocycleMapService.mock';
import MuscleGroupMapServiceMock from '$services/documentMapServices/muscleGroupMapService.mock';
import MockData from '$testUtils/MockData';
import perfTestUtils from '$testUtils/perfTestUtils';
import TestUsers from '$testUtils/TestUsers';
import type { WorkoutApiInsertKey } from '$util/workoutPersistenceUtils';

/**
 * Document counts the seeded perf user is expected to have. Single source of
 * truth: the keys drive every collection iteration below, and the values are
 * compared against the live response to decide whether to wipe + reseed.
 */
const EXPECTED_COUNTS: Record<WorkoutApiInsertKey, number> = {
  mesocycles: 1,
  microcycles: 4,
  sessions: 20,
  sessionExercises: 48,
  sets: 117,
  exercises: 12,
  exerciseCalibrations: 12,
  muscleGroups: 10,
  equipmentTypes: 5
};

/**
 * Type-guarded keys of `EXPECTED_COUNTS`. `Object.keys` widens to `string[]`,
 * so we narrow with a predicate to keep the static union throughout.
 */
const COLLECTION_KEYS = Object.keys(EXPECTED_COUNTS).filter(
  (key): key is WorkoutApiInsertKey => key in EXPECTED_COUNTS
);

/**
 * Fixed start date for the generated mesocycle so the seeded data is
 * deterministic across runs.
 */
const SEED_START_DATE = new Date('2026-01-05T00:00:00.000Z');

test('seed perf user', async () => {
  // The shared vitest setup file installs a mock on APIService.callWorkoutAPI
  // (and is required for module-resolution reasons). Restore the original here
  // so the seed actually hits the backend.
  vi.restoreAllMocks();

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

  const getAllOptions: ProjectWorkoutPrimaryEndpointOptions = {
    get: Object.fromEntries(COLLECTION_KEYS.map((key) => [key, { all: true }]))
  };
  const existing = await APIService.callWorkoutAPI({ options: getAllOptions });
  if (!existing.success) {
    throw new Error(`Failed to fetch existing docs: ${JSON.stringify(existing.errors)}`);
  }

  const currentCounts = Object.fromEntries(
    COLLECTION_KEYS.map((key) => [key, existing.data[key]?.length ?? 0])
  );
  console.log('Current counts:', currentCounts);
  if (COLLECTION_KEYS.every((key) => currentCounts[key] === EXPECTED_COUNTS[key])) {
    console.log('Counts match expected. Skipping wipe + reinsert.');
    return;
  }
  console.log('Counts do not match. Wiping and reseeding.');

  // The mock factories build documents using `TestUsers.currentUserCto._id`,
  // some at class-load time. Point it at the perf user, then rebuild the data
  // and overwrite the userId on every doc so all collections belong to them.
  TestUsers.currentUserCto._id = authedUserId;
  MockData.resetAll();
  const baseData = MockData.setupBaseData();
  const muscleGroups = Object.values(MuscleGroupMapServiceMock.defaultMuscleGroups);
  const generated = MesocycleMapServiceMock.generateFullMesocycle(baseData, {
    title: 'Perf seed mesocycle',
    startDate: SEED_START_DATE
  });

  const insertPayload: ProjectWorkoutPrimaryEndpointOptions['insert'] = {
    mesocycles: [generated.mesocycle],
    microcycles: generated.microcycles,
    sessions: generated.sessions,
    sessionExercises: generated.sessionExercises,
    sets: generated.sets,
    exercises: baseData.exercises,
    exerciseCalibrations: baseData.calibrations,
    muscleGroups,
    equipmentTypes: baseData.equipmentTypes
  };
  for (const docs of Object.values(insertPayload)) {
    for (const doc of docs) doc.userId = authedUserId;
  }

  const deletePayload: ProjectWorkoutPrimaryEndpointOptions['delete'] = Object.fromEntries(
    COLLECTION_KEYS.map((key) => [key, (existing.data[key] ?? []).map((doc) => doc._id)])
  );

  const result = await APIService.callWorkoutAPI({
    options: { delete: deletePayload, insert: insertPayload }
  });
  if (!result.success) {
    throw new Error(`Seed failed: ${JSON.stringify(result.errors)}`);
  }
  console.log('Seed complete.');
}, 60_000);
