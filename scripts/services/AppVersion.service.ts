import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import gitService from './Git.service';
import { PROJECT_ROOT } from '../constants/projectRoot';

/**
 * The combined Android app version. `version` is the semver string, held in
 * `package.json` `version` and mirrored to `android/app/build.gradle`
 * `versionName`. `versionCode` is the integer Play orders uploads by, and lives
 * only in `build.gradle`.
 */
export type AppVersion = {
  version: string;
  versionCode: number;
};

/**
 * The authority on the app's version, which lives in `package.json` `version`
 * and `android/app/build.gradle` `versionName` / `versionCode`.
 */
class AppVersionService {
  readonly #packageJsonName = 'package.json';
  readonly #packageJsonPath = join(PROJECT_ROOT, this.#packageJsonName);
  readonly #buildGradlePath = join(PROJECT_ROOT, 'android', 'app', 'build.gradle');
  readonly #packageVersionPattern = /"version"\s*:\s*"([^"]+)"/;
  readonly #gradleVersionNamePattern = /versionName\s+"([^"]+)"/;
  readonly #gradleVersionCodePattern = /versionCode\s+(\d+)/;

  /**
   * Reads the full version, verifying that `package.json` `version` and
   * `build.gradle` `versionName` still hold the same semver. Drift means
   * someone edited one without the other, so this throws rather than letting a
   * build ship two disagreeing version strings.
   */
  read(): AppVersion {
    const packageText = readFileSync(this.#packageJsonPath, 'utf-8');
    const version = this.#matchOrThrow(
      packageText,
      this.#packageVersionPattern,
      this.#packageJsonPath
    );

    const gradleText = readFileSync(this.#buildGradlePath, 'utf-8');
    const gradleVersionName = this.#matchOrThrow(
      gradleText,
      this.#gradleVersionNamePattern,
      this.#buildGradlePath
    );
    const gradleVersionCode = this.#matchOrThrow(
      gradleText,
      this.#gradleVersionCodePattern,
      this.#buildGradlePath
    );

    if (version !== gradleVersionName) {
      throw new Error(
        `Version drift: package.json "${version}" !== build.gradle versionName "${gradleVersionName}". Sync them and re-run.`
      );
    }

    return {
      version,
      versionCode: parseInt(gradleVersionCode, 10)
    };
  }

  /**
   * Reads `version` from the `package.json` recorded at a git ref, fetching the
   * ref first if the local repository does not have it.
   *
   * Deliberately skips the drift check `read` performs. A commit that already
   * carries drift cannot be corrected, so checking it here would permanently
   * block every later release rather than surface a fixable mistake.
   *
   * @param ref - The git ref to read from.
   */
  readPackageVersionAtRef(ref: string): string {
    gitService.ensureRefAvailable(ref);
    const text = gitService.readFileAtRef(ref, this.#packageJsonName);
    return this.#matchOrThrow(
      text,
      this.#packageVersionPattern,
      `${this.#packageJsonName} at ${ref}`
    );
  }

  /**
   * Writes `version` to `package.json` `version` and `build.gradle`
   * `versionName`, plus `versionCode` to `build.gradle`. Preserves surrounding
   * file content (no JSON re-serialization, no Gradle reformatting).
   *
   * @param next - The new app version values to persist.
   * @param next.version - Semver string written to both files.
   * @param next.versionCode - Integer code written to build.gradle only.
   */
  write({ version, versionCode }: AppVersion): void {
    const packageText = readFileSync(this.#packageJsonPath, 'utf-8');
    writeFileSync(
      this.#packageJsonPath,
      packageText.replace(/("version"\s*:\s*)"[^"]+"/, `$1"${version}"`)
    );

    let gradleText = readFileSync(this.#buildGradlePath, 'utf-8');
    gradleText = gradleText.replace(/(versionName\s+)"[^"]+"/, `$1"${version}"`);
    gradleText = gradleText.replace(/(versionCode\s+)\d+/, `$1${versionCode}`);
    writeFileSync(this.#buildGradlePath, gradleText);
  }

  /**
   * Runs `pattern` against `text` and returns the first capture group, or
   * throws a descriptive error citing `source` if it doesn't match.
   *
   * @param text - The text to search.
   * @param pattern - A regex with a single capture group.
   * @param source - Path/label used in the error message when the pattern misses.
   */
  #matchOrThrow(text: string, pattern: RegExp, source: string): string {
    const match = text.match(pattern);
    if (!match) {
      throw new Error(`Could not match ${String(pattern)} in ${source}`);
    }
    return match[1];
  }
}

const appVersionService = new AppVersionService();
export default appVersionService;
