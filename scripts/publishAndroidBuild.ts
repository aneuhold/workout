import { select } from '@inquirer/prompts';
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, '..');
const PACKAGE_JSON_PATH = join(PROJECT_ROOT, 'package.json');
const BUILD_GRADLE_PATH = join(PROJECT_ROOT, 'android', 'app', 'build.gradle');
const AAB_OUTPUT_PATH = join(
  PROJECT_ROOT,
  'android',
  'app',
  'build',
  'outputs',
  'bundle',
  'release',
  'app-release.aab'
);

const PLAY_CONSOLE_LINKS = [
  {
    label: 'Play Console — Releases Overview',
    url: 'https://play.google.com/console/u/0/developers/7096606584485556849/app/4974980926556665079/releases/overview'
  }
];

/**
 * The combined Android app version. `versionName` is mirrored across
 * `package.json` `version` and `android/app/build.gradle` `versionName` (always
 * kept in sync); `versionCode` lives only in `build.gradle` and increments on
 * every Play upload.
 */
type AppVersion = {
  versionName: string;
  versionCode: number;
};

enum BumpKind {
  None = 'None',
  Patch = 'Patch',
  Minor = 'Minor',
  Major = 'Major'
}

const main = async (): Promise<void> => {
  const commands = process.argv.slice(2);
  if (commands.length === 0) {
    throw new Error(
      'Usage: tsx scripts/publishAndroidBuild.ts <cmd1> [<cmd2> ...]\n' +
        "Example: tsx scripts/publishAndroidBuild.ts 'pnpm build:android' 'cd android && ./gradlew bundleRelease'"
    );
  }

  await promptAndApplyVersionBump();

  for (const command of commands) {
    runCommand(command);
  }

  const aabFolder = dirname(AAB_OUTPUT_PATH);
  runCommand(`open "${aabFolder}"`);

  console.log('');
  console.log('Built AAB artifact:');
  console.log(`  ${AAB_OUTPUT_PATH}`);
  console.log('');
  console.log('Upload the AAB to the internal testing track:');
  console.log(
    '  https://play.google.com/console/u/0/developers/7096606584485556849/app/4974980926556665079/tracks/internal-testing'
  );
};

/**
 * Prompts the user to pick a semver bump (or skip), and writes synced updates
 * to `package.json` and `android/app/build.gradle` if a bump is chosen. Any
 * bump increments `versionCode` by 1 (Play rejects duplicate codes) on top of
 * the semver bump to `versionName`.
 */
const promptAndApplyVersionBump = async (): Promise<void> => {
  const current = readAppVersion();

  console.log('Current version:');
  console.log(`  versionName : ${current.versionName} (package.json + build.gradle)`);
  console.log(`  versionCode : ${current.versionCode} (build.gradle)`);
  console.log('');
  console.log('Check the latest published versions before deciding:');
  for (const { label, url } of PLAY_CONSOLE_LINKS) {
    console.log(`  ${label}: ${url}`);
  }
  console.log('');

  const kind = await select<BumpKind>({
    message: 'Bump version?',
    choices: [
      { name: 'No bump', value: BumpKind.None },
      ...[BumpKind.Patch, BumpKind.Minor, BumpKind.Major].map((k) => ({
        name: `${k} (${current.versionName} → ${bumpSemver(current.versionName, k)})`,
        value: k
      }))
    ]
  });

  if (kind === BumpKind.None) {
    console.log('Skipping version bump.');
    return;
  }

  const next: AppVersion = {
    versionName: bumpSemver(current.versionName, kind),
    versionCode: current.versionCode + 1
  };
  writeAppVersion(next);

  console.log('');
  console.log(`Updated versionName -> ${next.versionName} (package.json + build.gradle)`);
  console.log(`Updated versionCode -> ${next.versionCode} (build.gradle)`);
};

/**
 * Runs a shell command from the project root with inherited stdio so the
 * user sees the build output live. Throws on non-zero exit.
 *
 * @param command - The full shell command to execute.
 */
const runCommand = (command: string): void => {
  console.log(`\n> ${command}\n`);
  const result = spawnSync(command, {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    shell: true
  });
  if (result.status !== 0) {
    throw new Error(`Command failed (exit ${result.status ?? 'null'}): ${command}`);
  }
};

/**
 * Reads the current app version from `package.json` and `build.gradle`,
 * verifying that the two files agree on `versionName` (drift means someone
 * edited one without the other — bail out so we don't silently overwrite the
 * stale side).
 */
const readAppVersion = (): AppVersion => {
  const pkgText = readFileSync(PACKAGE_JSON_PATH, 'utf-8');
  const gradleText = readFileSync(BUILD_GRADLE_PATH, 'utf-8');

  const packageVersion = matchOrThrow(pkgText, /"version"\s*:\s*"([^"]+)"/, PACKAGE_JSON_PATH);
  const gradleVersionName = matchOrThrow(gradleText, /versionName\s+"([^"]+)"/, BUILD_GRADLE_PATH);
  const gradleVersionCode = matchOrThrow(gradleText, /versionCode\s+(\d+)/, BUILD_GRADLE_PATH);

  if (packageVersion !== gradleVersionName) {
    throw new Error(
      `Version drift: package.json "${packageVersion}" !== build.gradle versionName "${gradleVersionName}". Sync them and re-run.`
    );
  }

  return {
    versionName: packageVersion,
    versionCode: parseInt(gradleVersionCode, 10)
  };
};

/**
 * Writes `versionName` to both `package.json` and `build.gradle`, plus
 * `versionCode` to `build.gradle`. Preserves surrounding file content
 * (no JSON re-serialization, no Gradle reformatting).
 *
 * @param next - The new app version values to persist.
 * @param next.versionName - Semver string mirrored to package.json + build.gradle.
 * @param next.versionCode - Integer code written to build.gradle only.
 */
const writeAppVersion = ({ versionName, versionCode }: AppVersion): void => {
  const pkgText = readFileSync(PACKAGE_JSON_PATH, 'utf-8');
  writeFileSync(
    PACKAGE_JSON_PATH,
    pkgText.replace(/("version"\s*:\s*)"[^"]+"/, `$1"${versionName}"`)
  );

  let gradleText = readFileSync(BUILD_GRADLE_PATH, 'utf-8');
  gradleText = gradleText.replace(/(versionName\s+)"[^"]+"/, `$1"${versionName}"`);
  gradleText = gradleText.replace(/(versionCode\s+)\d+/, `$1${versionCode}`);
  writeFileSync(BUILD_GRADLE_PATH, gradleText);
};

/**
 * Returns `version` bumped according to `kind`. Expects standard `major.minor.patch`
 * semver; throws on anything else so the prompt fails fast rather than producing
 * a garbage versionName.
 *
 * @param version - The current semver string (e.g. `1.2.3`).
 * @param kind - Which segment to bump. `BumpKind.None` returns the input unchanged.
 */
const bumpSemver = (version: string, kind: BumpKind): string => {
  if (kind === BumpKind.None) {
    return version;
  }

  const parts = version.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Cannot bump non-semver version "${version}"`);
  }

  let [major, minor, patch] = parts;
  switch (kind) {
    case BumpKind.Major:
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case BumpKind.Minor:
      minor += 1;
      patch = 0;
      break;
    case BumpKind.Patch:
      patch += 1;
      break;
  }
  return `${major}.${minor}.${patch}`;
};

/**
 * Runs `pattern` against `text` and returns the first capture group, or
 * throws a descriptive error citing `source` if it doesn't match.
 *
 * @param text - The text to search.
 * @param pattern - A regex with a single capture group.
 * @param source - Path/label used in the error message when the pattern misses.
 */
const matchOrThrow = (text: string, pattern: RegExp, source: string): string => {
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`Could not match ${String(pattern)} in ${source}`);
  }
  return match[1];
};

await main();
