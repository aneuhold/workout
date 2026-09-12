import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

/** Absolute path to the repository root. */
export const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
