import { writeFileSync } from 'fs';
import { readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { STORAGE_PREFIX } from '../src/util/LocalData/storagePrefix';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, '..');
const PACKAGE_JSON_PATH = join(PROJECT_ROOT, 'package.json');
const OUTPUT_PATH = join('build', 'version.json');

/**
 * Reads the `version` field from the project's `package.json`.
 */
const readPackageVersion = (): string => {
  const text = readFileSync(PACKAGE_JSON_PATH, 'utf-8');
  const match = text.match(/"version"\s*:\s*"([^"]+)"/);
  if (!match) {
    throw new Error(`Could not find "version" in ${PACKAGE_JSON_PATH}`);
  }
  return match[1];
};

const version = readPackageVersion();

const versionInfo = {
  appVersion: version,
  storageVersion: STORAGE_PREFIX
};

writeFileSync(OUTPUT_PATH, JSON.stringify(versionInfo, null, 2));
console.log(`Wrote ${OUTPUT_PATH}:`, versionInfo);
