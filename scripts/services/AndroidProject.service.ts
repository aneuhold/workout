import { writeFileSync } from 'fs';
import { join } from 'path';
import { PROJECT_ROOT } from '../constants/projectRoot';
import scriptCLIService from './ScriptCLI.service';

/**
 * Paths, build steps, and operations exclusive to the native Android project.
 */
class AndroidProjectService {
  /** Gradle's root project directory. */
  readonly directory = join(PROJECT_ROOT, 'android');

  /** The signed release bundle, which is the artifact Play accepts. */
  readonly aabPath = join(
    this.directory,
    'app',
    'build',
    'outputs',
    'bundle',
    'release',
    'app-release.aab'
  );

  /**
   * Used for the signing key.
   */
  readonly keystorePath = join(this.directory, 'mesopro-upload.jks');

  /**
   * Used for the signing key properties.
   */
  readonly keystorePropertiesPath = join(this.directory, 'keystore.properties');

  readonly #keyAlias = 'mesopro';

  /**
   * Materializes the upload keystore and its `keystore.properties` from
   * `ANDROID_KEYSTORE_BASE64` and `ANDROID_KEYSTORE_PASSWORD`.
   *
   * With neither variable set, any existing `keystore.properties` is left alone
   * so a developer machine signs with its own configuration. With exactly one
   * set this throws: Gradle's `keystorePropertiesFile.exists()` guard would
   * otherwise fall through and hand back an unsigned bundle.
   *
   * @see https://developer.android.com/studio/publish/app-signing#secure-shared-keystore
   */
  writeSigningConfigFromEnvironment(): void {
    const { ANDROID_KEYSTORE_BASE64: keystoreBase64, ANDROID_KEYSTORE_PASSWORD: keystorePassword } =
      process.env;

    if (!keystoreBase64 && !keystorePassword) {
      console.log(
        `No ANDROID_KEYSTORE_* variables set, using ${this.keystorePropertiesPath} as-is.`
      );
      return;
    }
    if (!keystoreBase64 || !keystorePassword) {
      throw new Error(
        'ANDROID_KEYSTORE_BASE64 and ANDROID_KEYSTORE_PASSWORD must both be set, or neither. ' +
          'Setting only one produces an unsigned bundle.'
      );
    }

    writeFileSync(this.keystorePath, Buffer.from(keystoreBase64, 'base64'));
    writeFileSync(
      this.keystorePropertiesPath,
      [
        `storeFile=${this.keystorePath}`,
        `storePassword=${keystorePassword}`,
        `keyAlias=${this.#keyAlias}`,
        `keyPassword=${keystorePassword}`,
        ''
      ].join('\n')
    );
    console.log(
      `Wrote ${this.keystorePath} and ${this.keystorePropertiesPath} from the environment.`
    );
  }

  /**
   * Copies the web build and Capacitor configuration into the native project.
   */
  syncWebAssets(): void {
    scriptCLIService.run('pnpm cap sync android', PROJECT_ROOT);
  }

  /**
   * Builds the release bundle at `aabPath`, signed with whatever
   * `keystorePropertiesPath` currently configures.
   */
  bundleRelease(): void {
    scriptCLIService.run('./gradlew bundleRelease', this.directory);
  }
}

const androidProjectService = new AndroidProjectService();
export default androidProjectService;
