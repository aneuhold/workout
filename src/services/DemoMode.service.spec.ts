import { beforeEach, describe, expect, it } from 'vitest';
import exerciseMapService from '$services/documentMapServices/ExerciseMap.service.svelte';
import { userConfig } from '$stores/local/userConfig/userConfig';
import LocalData from '$util/LocalData/LocalData';
import SessionStorageBackend from '$util/LocalData/SessionStorageBackend';
import demoModeService from './DemoMode.service.svelte';

describe('DemoModeService', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  describe('isEnabled', () => {
    it('returns false when the tab never entered demo mode', () => {
      expect(demoModeService.isEnabled).toBe(false);
    });
  });

  describe('enter', () => {
    beforeEach(async () => {
      await LocalData.init(new SessionStorageBackend());
    });

    it('seeds a fresh demo, then resumes the stored one on the next entry', async () => {
      await demoModeService.enter();

      const storedSessionMap = await LocalData.getDocumentMap(LocalData.storedKeyNames.sessionMap);
      expect(demoModeService.isEnabled).toBe(true);
      expect(Object.keys(storedSessionMap ?? {}).length).toBeGreaterThan(0);
      expect(exerciseMapService.exerciseCTOs.length).toBeGreaterThan(0);
      // A freshly seeded demo derives the same exercise history a resumed one has
      expect(exerciseMapService.exerciseCTOs.every((cto) => cto.bestSet !== null)).toBe(true);
      expect(window.localStorage).toHaveLength(0);

      userConfig.update((config) => ({ ...config, username: 'Returning Visitor' }));
      userConfig.setWithoutPropagation({ ...userConfig.get(), username: 'Not Stored' });

      await demoModeService.enter();

      expect(userConfig.get().username).toBe('Returning Visitor');
    });
  });
});
