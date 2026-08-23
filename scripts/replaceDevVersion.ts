import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PROJECT_ROOT } from './constants/projectRoot';
import appVersionService from './services/AppVersion.service';

const BUILD_DIR = join(PROJECT_ROOT, 'build');
const PLACEHOLDER = '#DEV.VERSION#';
const TARGET_EXTENSIONS = ['.html', '.js', '.css'];

/**
 * Replaces every occurrence of `#DEV.VERSION#` in the static build output with
 * the current `version` from `package.json`. Runs after `vite build` so the
 * settings page (and anywhere else the placeholder is used) shows a real
 * version string in production while keeping source files version-agnostic.
 */
const main = (): void => {
  const version = appVersionService.read().version;
  const files = collectBuildFiles(BUILD_DIR);

  let filesChanged = 0;
  let totalReplacements = 0;
  for (const filePath of files) {
    const original = readFileSync(filePath, 'utf-8');
    const parts = original.split(PLACEHOLDER);
    if (parts.length === 1) {
      continue;
    }
    writeFileSync(filePath, parts.join(version));
    filesChanged += 1;
    totalReplacements += parts.length - 1;
  }

  console.log(
    `Replaced ${PLACEHOLDER} -> ${version} in ${filesChanged} file(s) (${totalReplacements} occurrence(s))`
  );
};

/**
 * Recursively collects every text file under `dir` whose extension is in
 * `TARGET_EXTENSIONS`. Binary assets (icons, fonts, etc.) are skipped because
 * the placeholder only ever lives in source-derived text output.
 *
 * @param dir - Absolute path of the directory to walk.
 */
const collectBuildFiles = (dir: string): string[] => {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectBuildFiles(fullPath));
      continue;
    }
    if (TARGET_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
};

main();
