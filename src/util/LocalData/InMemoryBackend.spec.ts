import { beforeEach, describe, expect, it } from 'vitest';
import type { ILocalDataBackend } from './ILocalDataBackend';
import InMemoryBackend from './InMemoryBackend';

describe('InMemoryBackend', () => {
  let backend: ILocalDataBackend;

  beforeEach(() => {
    backend = new InMemoryBackend();
  });

  it('round-trips a value through get/set/remove', async () => {
    await backend.set('v5-mesocycleMap', '{"foo":1}');
    expect(await backend.get('v5-mesocycleMap')).toBe('{"foo":1}');

    await backend.remove('v5-mesocycleMap');
    expect(await backend.get('v5-mesocycleMap')).toBeNull();
  });

  it('returns null for keys that were never set', async () => {
    expect(await backend.get('missing')).toBeNull();
  });

  it('keeps values within the instance that stored them', async () => {
    await backend.set('v5-password', 'secret');

    expect(await new InMemoryBackend().get('v5-password')).toBeNull();
  });

  describe('cleanupOldVersions', () => {
    it('keeps every stored value', async () => {
      await backend.set('v4-mesocycleMap', 'stale');
      await backend.set('v5-mesocycleMap', 'current');

      await backend.cleanupOldVersions('v5-');

      expect(await backend.get('v4-mesocycleMap')).toBe('stale');
      expect(await backend.get('v5-mesocycleMap')).toBe('current');
    });
  });
});
