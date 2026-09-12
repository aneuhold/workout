import { type BaseDocument, DocumentService } from '@aneuhold/core-ts-db-lib';
import { beforeEach, describe, expect, it } from 'vitest';
import LocalData from './LocalData';

describe('LocalData', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await LocalData.init();
  });

  describe('tier routing', () => {
    it('writes small-tier keys (e.g. password) to localStorage', async () => {
      await LocalData.setPassword('hunter2');

      expect(window.localStorage.getItem(LocalData.storedKeyNames.password)).toBe('hunter2');
      expect(await LocalData.getPassword()).toBe('hunter2');
    });

    it('does not write large-tier keys (e.g. apiRequestQueue) to localStorage', async () => {
      await LocalData.setApiRequestQueue([{}]);

      expect(window.localStorage.getItem(LocalData.storedKeyNames.apiRequestQueue)).toBeNull();
      const roundTripped = await LocalData.getApiRequestQueue();
      expect(roundTripped).toEqual([{}]);
    });
  });

  describe('clearWorkoutMaps', () => {
    it('removes Map-suffixed keys but leaves auth/config keys alone', async () => {
      const docId = DocumentService.generateID();
      const map: Record<string, BaseDocument> = { [docId]: { _id: docId } };

      await LocalData.setPassword('keep-me');
      await LocalData.setDocumentMap(LocalData.storedKeyNames.mesocycleMap, map);
      await LocalData.setDocumentMap(LocalData.storedKeyNames.setMap, map);

      await LocalData.clearWorkoutMaps();

      expect(await LocalData.getPassword()).toBe('keep-me');
      expect(await LocalData.getDocumentMap(LocalData.storedKeyNames.mesocycleMap)).toBeNull();
      expect(await LocalData.getDocumentMap(LocalData.storedKeyNames.setMap)).toBeNull();
    });
  });
});
