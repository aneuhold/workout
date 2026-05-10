import { writeFileSync } from 'fs';
import { join } from 'path';
import { STORAGE_PREFIX } from '../src/util/LocalData/storagePrefix';

/**
 * Writes `STORAGE_PREFIX` to `build/.storage-version` so downstream tooling
 * (e.g. the perf workflow, which swaps main and PR builds in and out of
 * `./build/` between measurements) can detect which storage prefix the
 * staged build expects without grepping the bundler's output. The marker
 * is plain text, trailing-newline-free, e.g. `v4-`.
 */
const OUTPUT_PATH = join('build', '.storage-version');

writeFileSync(OUTPUT_PATH, STORAGE_PREFIX);
console.log(`Wrote ${OUTPUT_PATH} (${STORAGE_PREFIX})`);
