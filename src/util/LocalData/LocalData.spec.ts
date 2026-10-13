import {
  type BaseDocument,
  DocumentService,
  WorkoutUserConfigSchema
} from '@aneuhold/core-ts-db-lib';
import { beforeEach, describe, expect, it } from 'vitest';
import type { CurrentUser } from '$stores/local/currentUser/currentUser';
import MockUsers from '$util/MockUsers';
import LocalData from './LocalData';

describe('LocalData', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await LocalData.init();
  });

  const createCurrentUser = (): CurrentUser => ({
    userId: MockUsers.currentUserCto._id,
    username: 'stored-user',
    password: 'hunter2',
    accessToken: 'access-token',
    refreshTokenString: 'refresh-token'
  });

  describe('tier routing', () => {
    it('writes small-tier keys (e.g. currentUser) to localStorage', async () => {
      const user = createCurrentUser();
      await LocalData.setCurrentUser(user);

      expect(window.localStorage.getItem(LocalData.storedKeyNames.currentUser)).toBe(
        JSON.stringify(user)
      );
      expect(await LocalData.getCurrentUser()).toEqual(user);
    });

    it('does not write large-tier keys (e.g. apiRequestQueue) to localStorage', async () => {
      await LocalData.setApiRequestQueue([{}]);

      expect(window.localStorage.getItem(LocalData.storedKeyNames.apiRequestQueue)).toBeNull();
      const roundTripped = await LocalData.getApiRequestQueue();
      expect(roundTripped).toEqual([{}]);
    });
  });

  describe('clearWorkoutDocuments', () => {
    it('removes workout document keys but leaves the current user alone', async () => {
      const docId = DocumentService.generateID();
      const map: Record<string, BaseDocument> = { [docId]: { _id: docId } };
      const user = createCurrentUser();

      await LocalData.setCurrentUser(user);
      await LocalData.setDocumentMap(LocalData.storedKeyNames.mesocycleMap, map);
      await LocalData.setDocumentMap(LocalData.storedKeyNames.setMap, map);
      await LocalData.setWorkoutUserConfig(WorkoutUserConfigSchema.parse({ userId: user.userId }));

      await LocalData.clearWorkoutDocuments();

      expect(await LocalData.getCurrentUser()).toEqual(user);
      expect(await LocalData.getDocumentMap(LocalData.storedKeyNames.mesocycleMap)).toBeNull();
      expect(await LocalData.getDocumentMap(LocalData.storedKeyNames.setMap)).toBeNull();
      expect(await LocalData.getWorkoutUserConfig()).toBeNull();
    });
  });
});
