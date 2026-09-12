import { select } from '@inquirer/prompts';
import appVersionService from '../../services/AppVersion.service';
import semverBumpService from './SemverBump.service';
import { BumpKind } from './types';

/**
 * Bumps the app version, taking the segment to bump from the first CLI
 * argument and falling back to an interactive prompt when it is absent.
 */
const main = async (): Promise<void> => {
  const argKind = readBumpKindArg();
  const current = appVersionService.read();

  console.log('Current version:');
  console.log(`  version     : ${current.version} (package.json + build.gradle versionName)`);
  console.log(`  versionCode : ${current.versionCode} (build.gradle)`);
  console.log('');

  const kind =
    argKind ??
    (await select<BumpKind>({
      message: 'Bump version?',
      choices: [BumpKind.Patch, BumpKind.Minor, BumpKind.Major].map((bumpKind) => ({
        name: `${bumpKind} (${current.version} → ${semverBumpService.next(current.version, bumpKind)})`,
        value: bumpKind
      }))
    }));

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

/**
 * Reads the bump kind from the first CLI argument, matched case-insensitively
 * against `BumpKind`. Returns `undefined` when no argument is given, which
 * leaves the choice to the interactive prompt.
 */
const readBumpKindArg = (): BumpKind | undefined => {
  const arg = process.argv[2];
  if (!arg) {
    return undefined;
  }

  const kind = Object.values(BumpKind).find(
    (bumpKind) => bumpKind.toLowerCase() === arg.toLowerCase()
  );
  if (!kind) {
    throw new Error(
      `Unknown bump kind "${arg}"\n` +
        'Usage: pnpm bump [patch|minor|major]\n' +
        'Omit the argument to choose interactively.'
    );
  }
  return kind;
};

await main();
