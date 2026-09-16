import { beforeEach, describe, expect, it } from 'vitest';
import SessionData from './SessionData';

describe('SessionData', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  describe('getDemoModeEnabled', () => {
    it('returns false when nothing is stored', () => {
      expect(SessionData.getDemoModeEnabled()).toBe(false);
    });
  });

  describe('setDemoModeEnabled', () => {
    it('round-trips demo mode on and back off', () => {
      SessionData.setDemoModeEnabled(true);
      expect(SessionData.getDemoModeEnabled()).toBe(true);

      SessionData.setDemoModeEnabled(false);
      expect(SessionData.getDemoModeEnabled()).toBe(false);
    });

    it('keeps the flag out of localStorage', () => {
      SessionData.setDemoModeEnabled(true);

      expect(window.localStorage.getItem(SessionData.storedKeyNames.demoMode)).toBeNull();
    });
  });
});
