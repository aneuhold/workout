import { beforeEach, describe, expect, it } from 'vitest';
import LocalData from '$util/LocalData/LocalData';
import SessionStorageBackend from '$util/LocalData/SessionStorageBackend';
import muscleGroupMapServiceMock, { MockDefaultMuscleGroup } from './MuscleGroupMap.service.mock';
import muscleGroupMapService from './MuscleGroupMap.service.svelte';

describe('Unit Tests', () => {
  describe('hydrate', () => {
    beforeEach(async () => {
      await LocalData.init(new SessionStorageBackend());
    });

    it('should restore the volume CTOs that were set before', async () => {
      muscleGroupMapServiceMock.setVolumeHistory({
        [MockDefaultMuscleGroup.Chest]: { startingSetCount: 8, exerciseCount: 2 }
      });
      const ctoIds = muscleGroupMapService.allVolumeCTOs.map((cto) => cto._id);
      const cachedCTOMap = await LocalData.getDocumentMap(
        LocalData.storedKeyNames.muscleGroupVolumeCTOMap
      );
      muscleGroupMapService.setVolumeCTOs([]);
      await LocalData.setDocumentMap(
        LocalData.storedKeyNames.muscleGroupVolumeCTOMap,
        cachedCTOMap ?? {}
      );

      await muscleGroupMapService.hydrate();

      expect(ctoIds.length).toBeGreaterThan(0);
      expect(muscleGroupMapService.allVolumeCTOs.map((cto) => cto._id)).toEqual(ctoIds);
    });
  });
});
