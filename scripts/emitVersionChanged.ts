import { appendFileSync } from 'fs';
import appVersionService from './services/AppVersion.service';

/**
 * Reports whether `package.json` `version` differs between a base git ref and
 * the working tree, which is what marks a commit as a release.
 *
 * Writes `changed=<boolean>` to `$GITHUB_OUTPUT` when running under Actions,
 * and always prints the comparison so it reads plainly when run by hand.
 */
const main = (): void => {
  const baseRef = process.argv[2];
  if (!baseRef) {
    throw new Error(
      'Usage: tsx scripts/emitVersionChanged.ts <baseRef>\n' +
        'Example: tsx scripts/emitVersionChanged.ts origin/main'
    );
  }

  const baseVersion = appVersionService.readPackageVersionAtRef(baseRef);
  const currentVersion = appVersionService.read().version;
  const changed = baseVersion !== currentVersion;

  const githubOutputPath = process.env.GITHUB_OUTPUT;
  if (githubOutputPath) {
    appendFileSync(githubOutputPath, `changed=${changed}\n`);
  }
  console.log(
    `Version ${changed ? 'changed' : 'unchanged'}: ${baseRef} is ${baseVersion}, working tree is ${currentVersion}`
  );
};

main();
