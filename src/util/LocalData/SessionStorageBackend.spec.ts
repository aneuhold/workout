import { beforeEach, describe, expect, it } from 'vitest';
import SessionStorageBackend from './SessionStorageBackend';

describe('SessionStorageBackend', () => {
  let backend: SessionStorageBackend;

  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    backend = new SessionStorageBackend();
  });

  it('round-trips a value through get/set/remove', async () => {
    await backend.set('foo', 'bar');
    expect(await backend.get('foo')).toBe('bar');

    await backend.remove('foo');
    expect(await backend.get('foo')).toBeNull();
  });

  it('returns null for keys that were never set', async () => {
    expect(await backend.get('missing')).toBeNull();
  });

  it('keeps values out of localStorage', async () => {
    await backend.set('v5-userConfig', 'demo');

    expect(window.sessionStorage.getItem('v5-userConfig')).toBe('demo');
    expect(window.localStorage.getItem('v5-userConfig')).toBeNull();
  });

  describe('cleanupOldVersions', () => {
    it('deletes legacy v\\d+- keys that do not match the current prefix', async () => {
      window.sessionStorage.setItem('v3-password', 'old');
      window.sessionStorage.setItem('v4-mesocycleMap', 'old');
      window.sessionStorage.setItem('v5-password', 'current');

      await backend.cleanupOldVersions('v5-');

      expect(window.sessionStorage.getItem('v3-password')).toBeNull();
      expect(window.sessionStorage.getItem('v4-mesocycleMap')).toBeNull();
      expect(window.sessionStorage.getItem('v5-password')).toBe('current');
    });

    it('leaves keys outside the v\\d+- shape untouched', async () => {
      window.sessionStorage.setItem('sveltekit:scroll', 'keep');
      window.sessionStorage.setItem('sveltekit:snapshot', 'keep');

      await backend.cleanupOldVersions('v5-');

      expect(window.sessionStorage.getItem('sveltekit:scroll')).toBe('keep');
      expect(window.sessionStorage.getItem('sveltekit:snapshot')).toBe('keep');
    });
  });
});
