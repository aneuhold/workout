import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mockBackendService from '$services/MockBackendService/MockBackend.service';
import MockDataService from '$services/MockDataService/MockData.service';
import sessionMapService from './SessionMap.service.svelte';

describe('Unit Tests', () => {
  beforeEach(() => {
    mockBackendService.setupGlobalMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildFreeFormSession', () => {
    it('should not add the session to the map', () => {
      MockDataService.setupBaseData();

      const session = sessionMapService.buildFreeFormSession();

      expect(sessionMapService.getDoc(session._id)).toBeUndefined();
      expect(sessionMapService.isFreeFormSession(session)).toBe(true);
    });
  });
});
