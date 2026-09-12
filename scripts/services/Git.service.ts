import { PROJECT_ROOT } from '../constants/projectRoot';
import scriptCLIService from './ScriptCLI.service';

/**
 * Read-only git queries against the repository the scripts run in.
 */
class GitService {
  readonly #remoteName = 'origin';

  /**
   * Makes `ref` resolvable, shallow-fetching it when the local repository does
   * not already have it. Only `<remote>/<branch>` refs can be fetched; anything
   * else must already resolve (deepen the checkout if it does not).
   *
   * @param ref - The git ref to make resolvable.
   */
  ensureRefAvailable(ref: string): void {
    if (this.#run(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]) !== null) {
      return;
    }

    const remotePrefix = `${this.#remoteName}/`;
    if (!ref.startsWith(remotePrefix)) {
      throw new Error(
        `Ref "${ref}" does not resolve locally and is not a ${this.#remoteName} ref.`
      );
    }

    const branch = ref.slice(remotePrefix.length);
    const fetched = this.#run([
      'fetch',
      '--depth=1',
      this.#remoteName,
      `+refs/heads/${branch}:refs/remotes/${this.#remoteName}/${branch}`
    ]);
    if (fetched === null) {
      throw new Error(`Could not fetch "${ref}".`);
    }
  }

  /**
   * Returns the contents a file had at `ref`.
   *
   * @param ref - The git ref to read from.
   * @param filePath - Repository-relative path of the file.
   */
  readFileAtRef(ref: string, filePath: string): string {
    const text = this.#run(['show', `${ref}:${filePath}`]);
    if (text === null) {
      throw new Error(`Could not read ${filePath} at "${ref}".`);
    }
    return text;
  }

  /**
   * Returns the subject line of the checked-out commit.
   */
  currentCommitSubject(): string {
    const subject = this.#run(['log', '-1', '--pretty=%s']);
    if (subject === null) {
      throw new Error('Could not read the current commit message.');
    }
    return subject;
  }

  /**
   * Runs a git command from the project root, returning its trimmed stdout or
   * `null` when the command fails.
   *
   * @param args - Arguments passed to `git`.
   */
  #run(args: string[]): string | null {
    return scriptCLIService.capture('git', args, PROJECT_ROOT);
  }
}

const gitService = new GitService();
export default gitService;
