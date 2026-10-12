import {
  APIErrorCode,
  type APIResponse,
  APIService,
  type ProjectWorkoutPrimaryEndpointOptions,
  type ProjectWorkoutPrimaryOutput
} from '@aneuhold/core-ts-api-lib';
import { DocumentService } from '@aneuhold/core-ts-db-lib';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  type MockInstance,
  vi
} from 'vitest';
import apiActivityService, {
  ApiActivityState
} from '$services/ApiActivityService/ApiActivity.service.svelte';
import setMapServiceMock from '$services/documentMapServices/SetMap.service.mock';
import setMapService from '$services/documentMapServices/SetMap.service.svelte';
import MockAPIBackend from '$services/MockEnvSetupService/MockAPIBackend';
import { userConfig } from '$stores/local/userConfig/userConfig';
import { ctoGet } from '$util/ctoGet';
import LocalData from '$util/LocalData/LocalData';
import workoutAPIQueueService from './WorkoutAPIQueue.service';

describe('Unit Tests', () => {
  describe('WorkoutAPIQueueService', () => {
    const fullSetGet: ProjectWorkoutPrimaryEndpointOptions = { get: { sets: { all: true } } };
    let apiBackend: MockAPIBackend;
    let onGetOutput: Mock<(...args: unknown[]) => void>;
    let consoleErrorSpy: MockInstance<typeof console.error>;

    /**
     * Creates a write that deletes a random set.
     */
    const createDeleteSetRequest = (): ProjectWorkoutPrimaryEndpointOptions => ({
      delete: { sets: [DocumentService.generateID()] }
    });

    /**
     * Adds a set with random parent IDs to the set map.
     */
    const addSetToSetMap = () =>
      setMapServiceMock.addSet({
        workoutExerciseId: DocumentService.generateID(),
        workoutSessionId: DocumentService.generateID(),
        workoutSessionExerciseId: DocumentService.generateID()
      });

    beforeEach(() => {
      apiBackend = new MockAPIBackend();
      APIService.setBackend(apiBackend);
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      // Takes the full backoff delay, so delays are exact
      vi.spyOn(Math, 'random').mockReturnValue(1);
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      userConfig.setWithoutPropagation({ ...userConfig.get(), accessToken: 'access-token' });
      onGetOutput = vi.fn();
      workoutAPIQueueService.setGetOutputHandler(onGetOutput);
    });

    afterEach(async () => {
      await workoutAPIQueueService.reset();
      apiActivityService.setIdle();
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    describe('skipWaitsAndProcessRequestsNow', () => {
      describe('when the request is rejected', () => {
        it('is Offline and sends the item on the next attempt', async () => {
          const first = createDeleteSetRequest();
          const second = createDeleteSetRequest();
          apiBackend.queueWorkoutApiResponses(
            MockAPIBackend.createWorkoutApiSuccessResponse(),
            new Error('Network error')
          );

          workoutAPIQueueService.enqueueRequest(first);
          workoutAPIQueueService.enqueueRequest(second);
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();

          expect(apiActivityService.state).toBe(ApiActivityState.Offline);

          await vi.advanceTimersByTimeAsync(1000);
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();

          expect(apiBackend.sentWorkoutApiRequests).toEqual([first, second, second]);
          expect(apiActivityService.state).toBe(ApiActivityState.Success);
        });

        it('keeps the item in storage', async () => {
          const write = createDeleteSetRequest();
          apiBackend.queueWorkoutApiResponses(new Error('Network error'));

          workoutAPIQueueService.enqueueRequest(write);
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();

          await vi.waitFor(async () => {
            expect(await LocalData.getApiRequestQueue()).toEqual([write]);
          });
        });
      });

      describe('when the device is offline', () => {
        it('is Offline, sends nothing, and schedules no retry until called again online', async () => {
          const onLineSpy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
          const write = createDeleteSetRequest();

          workoutAPIQueueService.enqueueRequest(write);
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();

          expect(apiActivityService.state).toBe(ApiActivityState.Offline);
          expect(apiBackend.sentWorkoutApiRequests).toHaveLength(0);
          expect(vi.getTimerCount()).toBe(0);

          onLineSpy.mockReturnValue(true);
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();

          expect(apiBackend.sentWorkoutApiRequests).toEqual([write]);
        });

        it('stops retrying a rejected request', async () => {
          const onLineSpy = vi.spyOn(navigator, 'onLine', 'get');
          apiBackend.queueWorkoutApiResponses(new Error('Network error'));

          workoutAPIQueueService.enqueueRequest(createDeleteSetRequest());
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();
          onLineSpy.mockReturnValue(false);
          await vi.advanceTimersByTimeAsync(1000);

          expect(apiBackend.sentWorkoutApiRequests).toHaveLength(1);
          expect(vi.getTimerCount()).toBe(0);
        });
      });

      describe('backoff', () => {
        it('grows, is capped, and resets after a success', async () => {
          const networkErrors = Array.from({ length: 7 }, () => new Error('Network error'));
          apiBackend.queueWorkoutApiResponses(
            ...networkErrors,
            MockAPIBackend.createWorkoutApiSuccessResponse(),
            new Error('Network error')
          );

          workoutAPIQueueService.enqueueRequest(createDeleteSetRequest());
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();
          for (const delay of [1000, 2000, 4000, 8000, 16_000, 32_000, 60_000]) {
            const sentCount = apiBackend.sentWorkoutApiRequests.length;
            await vi.advanceTimersByTimeAsync(delay - 1);
            expect(apiBackend.sentWorkoutApiRequests).toHaveLength(sentCount);
            await vi.advanceTimersByTimeAsync(1);
            expect(apiBackend.sentWorkoutApiRequests).toHaveLength(sentCount + 1);
          }

          // The eighth attempt succeeded, so the next failure starts over
          workoutAPIQueueService.enqueueRequest(createDeleteSetRequest());
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();
          const sentCount = apiBackend.sentWorkoutApiRequests.length;
          await vi.advanceTimersByTimeAsync(1000);
          expect(apiBackend.sentWorkoutApiRequests).toHaveLength(sentCount + 1);
        });

        it('is skipped', async () => {
          apiBackend.queueWorkoutApiResponses(new Error('Network error'));

          workoutAPIQueueService.enqueueRequest(createDeleteSetRequest());
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();

          expect(apiBackend.sentWorkoutApiRequests).toHaveLength(2);
        });
      });

      describe('when the server errors', () => {
        it('is Pending, retries up to 5 attempts, then removes the item', async () => {
          const failing = createDeleteSetRequest();
          const next = createDeleteSetRequest();
          const serverErrors = Array.from({ length: 5 }, () =>
            MockAPIBackend.createWorkoutApiFailureResponse(APIErrorCode.InternalError, 500)
          );
          apiBackend.queueWorkoutApiResponses(...serverErrors);

          workoutAPIQueueService.enqueueRequest(failing);
          workoutAPIQueueService.enqueueRequest(next);
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();
          expect(apiActivityService.state).toBe(ApiActivityState.Pending);

          for (let attempt = 2; attempt <= 5; attempt++) {
            await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();
          }

          expect(apiBackend.sentWorkoutApiRequests).toEqual([
            ...Array.from({ length: 5 }, () => failing),
            next
          ]);
          expect(consoleErrorSpy).toHaveBeenCalledOnce();
          expect(apiActivityService.state).toBe(ApiActivityState.Error);
        });

        it('retries a response that failed to parse', async () => {
          const write = createDeleteSetRequest();
          apiBackend.queueWorkoutApiResponses(
            MockAPIBackend.createWorkoutApiFailureResponse(
              APIErrorCode.InvalidAPIResponseShape,
              200
            )
          );

          workoutAPIQueueService.enqueueRequest(write);
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();
          expect(apiActivityService.state).toBe(ApiActivityState.Pending);
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();

          expect(apiBackend.sentWorkoutApiRequests).toEqual([write, write]);
        });
      });

      describe('when the login expired', () => {
        it('pauses without removing anything, then resumes after login', async () => {
          const first = createDeleteSetRequest();
          const second = createDeleteSetRequest();
          apiBackend.queueWorkoutApiResponses(
            MockAPIBackend.createWorkoutApiFailureResponse(APIErrorCode.Unauthorized, 401)
          );

          workoutAPIQueueService.enqueueRequest(first);
          workoutAPIQueueService.enqueueRequest(second);
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();
          await vi.advanceTimersByTimeAsync(120_000);

          expect(apiBackend.sentWorkoutApiRequests).toHaveLength(1);
          expect(apiActivityService.state).toBe(ApiActivityState.Pending);
          expect(consoleErrorSpy).not.toHaveBeenCalled();

          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();

          expect(apiBackend.sentWorkoutApiRequests).toEqual([first, first, second]);
        });

        it('sends nothing while logged out', async () => {
          userConfig.setWithoutPropagation({ ...userConfig.get(), accessToken: null });

          workoutAPIQueueService.enqueueRequest(createDeleteSetRequest());
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();

          expect(apiBackend.sentWorkoutApiRequests).toHaveLength(0);
          expect(apiActivityService.state).toBe(ApiActivityState.Pending);
        });
      });

      describe('when the request is rejected by the server', () => {
        it('removes the item and continues with the rest of the queue', async () => {
          const bad = createDeleteSetRequest();
          const next = createDeleteSetRequest();
          apiBackend.queueWorkoutApiResponses(
            MockAPIBackend.createWorkoutApiFailureResponse(APIErrorCode.BadRequest, 400)
          );

          workoutAPIQueueService.enqueueRequest(bad);
          workoutAPIQueueService.enqueueRequest(next);
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();

          expect(apiBackend.sentWorkoutApiRequests).toEqual([bad, next]);
          expect(consoleErrorSpy).toHaveBeenCalledOnce();
          expect(apiActivityService.state).toBe(ApiActivityState.Error);
        });
      });

      describe('when a write is queued while a get is outstanding', () => {
        it('discards the snapshot and runs the get again after the write', async () => {
          const existing = addSetToSetMap();
          const added = addSetToSetMap();
          const snapshot = Promise.withResolvers<APIResponse<ProjectWorkoutPrimaryOutput>>();
          apiBackend.queueWorkoutApiResponses(
            snapshot.promise,
            MockAPIBackend.createWorkoutApiSuccessResponse(),
            MockAPIBackend.createWorkoutApiSuccessResponse({ sets: [existing, added] })
          );
          workoutAPIQueueService.setGetOutputHandler((output, input) => {
            onGetOutput(output, input);
            setMapService.handleApiOutput(output, input);
          });

          workoutAPIQueueService.enqueueRequest(fullSetGet);
          const insert: ProjectWorkoutPrimaryEndpointOptions = { insert: { sets: [added] } };
          workoutAPIQueueService.enqueueRequest(insert);
          snapshot.resolve(MockAPIBackend.createWorkoutApiSuccessResponse({ sets: [existing] }));
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();

          expect(apiBackend.sentWorkoutApiRequests).toEqual([fullSetGet, insert, fullSetGet]);
          expect(onGetOutput).toHaveBeenCalledOnce();
          expect(setMapService.getDoc(added._id)).toEqual(added);
        });
      });

      describe('when a full refresh and a set mutation share a session', () => {
        it('does not reduce the set map to the echoed set', async () => {
          const updated = addSetToSetMap();
          const other = addSetToSetMap();
          apiBackend.queueWorkoutApiResponses(
            MockAPIBackend.createWorkoutApiSuccessResponse({ sets: [updated, other] }),
            MockAPIBackend.createWorkoutApiSuccessResponse({ sets: [updated] }),
            MockAPIBackend.createWorkoutApiSuccessResponse({ sets: [updated, other] })
          );
          workoutAPIQueueService.setGetOutputHandler((output, input) => {
            setMapService.handleApiOutput(output, input);
          });

          workoutAPIQueueService.enqueueRequest(fullSetGet);
          workoutAPIQueueService.enqueueRequest({ update: { sets: [updated] }, get: ctoGet });
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();

          expect(apiBackend.sentWorkoutApiRequests).toEqual([
            fullSetGet,
            { update: { sets: [updated] } },
            { get: { ...fullSetGet.get, ...ctoGet } }
          ]);
          expect(setMapService.allDocs).toHaveLength(2);
        });
      });

      describe('when several writes carry a get', () => {
        it('sends one get after the last write', async () => {
          const writes = [
            createDeleteSetRequest(),
            createDeleteSetRequest(),
            createDeleteSetRequest()
          ];

          writes.forEach((write) => {
            workoutAPIQueueService.enqueueRequest({ ...write, get: ctoGet });
          });
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();

          expect(apiBackend.sentWorkoutApiRequests).toEqual([...writes, { get: ctoGet }]);
          expect(onGetOutput).toHaveBeenCalledOnce();
        });
      });

      describe('when an item is queued just as the loop finishes', () => {
        it('still processes it', async () => {
          const first = createDeleteSetRequest();
          const late = createDeleteSetRequest();
          const setSuccess = apiActivityService.setSuccess.bind(apiActivityService);
          vi.spyOn(apiActivityService, 'setSuccess').mockImplementationOnce(() => {
            setSuccess();
            workoutAPIQueueService.enqueueRequest(late);
          });

          workoutAPIQueueService.enqueueRequest(first);
          await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();

          expect(apiBackend.sentWorkoutApiRequests).toEqual([first, late]);
        });
      });
    });

    describe('hydrate', () => {
      it('does not send the stored queue until a request is queued, then sends it first', async () => {
        const stored = createDeleteSetRequest();
        await LocalData.setApiRequestQueue([stored]);

        await workoutAPIQueueService.hydrate();
        expect(apiBackend.sentWorkoutApiRequests).toHaveLength(0);

        workoutAPIQueueService.enqueueRequest(fullSetGet);
        await workoutAPIQueueService.skipWaitsAndProcessRequestsNow();

        expect(apiBackend.sentWorkoutApiRequests).toEqual([stored, fullSetGet]);
      });
    });

    describe('reset', () => {
      it('ignores the outstanding result and keeps running normally', async () => {
        const outstanding = Promise.withResolvers<APIResponse<ProjectWorkoutPrimaryOutput>>();
        // Never resolves, so the write queued after the reset stays queued
        const neverResolves = Promise.withResolvers<APIResponse<ProjectWorkoutPrimaryOutput>>();
        apiBackend.queueWorkoutApiResponses(outstanding.promise, neverResolves.promise);

        workoutAPIQueueService.enqueueRequest({ ...createDeleteSetRequest(), get: ctoGet });
        const oldLoop = workoutAPIQueueService.skipWaitsAndProcessRequestsNow();
        void workoutAPIQueueService.reset();

        const nextWrite = createDeleteSetRequest();
        workoutAPIQueueService.enqueueRequest(nextWrite);

        outstanding.resolve(MockAPIBackend.createWorkoutApiSuccessResponse());
        await oldLoop;

        await vi.waitFor(async () => {
          expect(await LocalData.getApiRequestQueue()).toEqual([nextWrite]);
        });
        expect(apiBackend.sentWorkoutApiRequests.at(-1)).toEqual(nextWrite);
        expect(onGetOutput).not.toHaveBeenCalled();
      });
    });
  });
});
