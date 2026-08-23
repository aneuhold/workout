import { select } from '@inquirer/prompts';
import appVersionService from '../services/AppVersion.service';
import semverBumpService from './SemverBump.service';
import { BumpKind } from './types';

const main = async (): Promise<void> => {
  const current = appVersionService.read();

  console.log('Current version:');
  console.log(`  version     : ${current.version} (package.json + build.gradle versionName)`);
  console.log(`  versionCode : ${current.versionCode} (build.gradle)`);
  console.log('');

  const kind = await select<BumpKind>({
    message: 'Bump version?',
    choices: [BumpKind.Patch, BumpKind.Minor, BumpKind.Major].map((bumpKind) => ({
      name: `${bumpKind} (${current.version} → ${semverBumpService.next(current.version, bumpKind)})`,
      value: bumpKind
    }))
  });

  // Play rejects a duplicate versionCode, so it moves on every bump regardless
  // of which semver segment changed.
  const next = {
    version: semverBumpService.next(current.version, kind),
    versionCode: current.versionCode + 1
  };
  appVersionService.write(next);

  console.log('');
  console.log(`Updated version -> ${next.version} (package.json + build.gradle versionName)`);
  console.log(`Updated versionCode -> ${next.versionCode} (build.gradle)`);
};

await main();
