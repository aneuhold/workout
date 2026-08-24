import { beforeEach, describe, expect, it } from 'vitest';
import LocalStorageBackend from './LocalStorageBackend';

describe('LocalStorageBackend', () => {
  let backend: LocalStorageBackend;

  beforeEach(() => {
    window.localStorage.clear();
    backend = new LocalStorageBackend();
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

  describe('cleanupOldVersions', () => {
    it('deletes legacy v\\d+- keys that do not match the current prefix', async () => {
      window.localStorage.setItem('v3-password', 'old');
      window.localStorage.setItem('v4-mesocycleMap', 'old');
      window.localStorage.setItem('v5-password', 'current');

      await backend.cleanupOldVersions('v5-');

      expect(window.localStorage.getItem('v3-password')).toBeNull();
      expect(window.localStorage.getItem('v4-mesocycleMap')).toBeNull();
      expect(window.localStorage.getItem('v5-password')).toBe('current');
    });

    it('leaves keys outside the v\\d+- shape untouched', async () => {
      window.localStorage.setItem('unrelated-app-key', 'keep');
      window.localStorage.setItem('theme', 'dark');

      await backend.cleanupOldVersions('v5-');

      expect(window.localStorage.getItem('unrelated-app-key')).toBe('keep');
      expect(window.localStorage.getItem('theme')).toBe('dark');
    });
  });
});
