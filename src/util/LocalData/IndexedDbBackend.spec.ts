import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import IndexedDbBackend from './IndexedDbBackend';

describe('IndexedDbBackend', () => {
  let backend: IndexedDbBackend;

  beforeEach(() => {
    // Reset the in-memory IndexedDB so each test gets a clean database.
    vi.stubGlobal('indexedDB', new IDBFactory());
    backend = new IndexedDbBackend();
  });

  it('round-trips a value through get/set/remove', async () => {
    await backend.init();
    await backend.set('v5-mesocycleMap', '{"foo":1}');
    expect(await backend.get('v5-mesocycleMap')).toBe('{"foo":1}');

    await backend.remove('v5-mesocycleMap');
    expect(await backend.get('v5-mesocycleMap')).toBeNull();
  });

  it('returns null for keys that were never set', async () => {
    expect(await backend.get('missing')).toBeNull();
  });

  describe('cleanupOldVersions', () => {
    it('deletes keys outside the current prefix and keeps current ones', async () => {
      await backend.set('v4-mesocycleMap', 'stale');
      await backend.set('v3-translations', 'stale');
      await backend.set('v5-mesocycleMap', 'current');

      await backend.cleanupOldVersions('v5-');

      expect(await backend.get('v4-mesocycleMap')).toBeNull();
      expect(await backend.get('v3-translations')).toBeNull();
      expect(await backend.get('v5-mesocycleMap')).toBe('current');
    });
  });
});
