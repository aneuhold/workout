/**
 * Cache-bust prefix for every key `LocalData` writes. Lives in its own
 * SvelteKit-free module so build-time scripts (e.g.
 * `scripts/emitStorageVersion.ts`) can import it via plain `tsx` without
 * tripping over `$app/environment`.
 */
export const STORAGE_PREFIX = 'v4-';
