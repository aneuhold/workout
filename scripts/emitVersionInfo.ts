import { writeFileSync } from 'fs';
import { join } from 'path';
import { STORAGE_PREFIX } from '../src/util/LocalData/storagePrefix';
import appVersionService from './services/AppVersion.service';

const OUTPUT_PATH = join('build', 'version.json');

const versionInfo = {
  appVersion: appVersionService.read().version,
  storageVersion: STORAGE_PREFIX
};

writeFileSync(OUTPUT_PATH, JSON.stringify(versionInfo, null, 2));
console.log(`Wrote ${OUTPUT_PATH}:`, versionInfo);
