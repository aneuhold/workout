import gitService from '../../services/Git.service';
import type { ReleaseDescription } from './types';

/**
 * Derives what a release calls itself from the commit that triggered it.
 *
 * NOTE FROM ANTON: This should be changed from just a boring and plan commit message to something
 * actually helpful, that is also shown to the user when they are asked to update the app. That
 * is a tad larger infra effort though, so leaving that for a different time.
 */
class ReleaseNotesService {
  /** Play rejects a release name longer than this. */
  readonly #maxNameLength = 50;

  /**
   * Returns the first line of the triggering commit message as both the release
   * name and its notes, with the name truncated to what Play accepts.
   *
   * CI passes the message through `RELEASE_COMMIT_MESSAGE`; a local run falls
   * back to the subject of the checked-out commit.
   */
  read(): ReleaseDescription {
    const message = process.env.RELEASE_COMMIT_MESSAGE ?? gitService.currentCommitSubject();
    const notes = message.split('\n')[0].trim();
    if (!notes) {
      throw new Error(
        'The triggering commit message is empty, so there is nothing to name the release.'
      );
    }

    return { name: notes.slice(0, this.#maxNameLength), notes };
  }
}

const releaseNotesService = new ReleaseNotesService();
export default releaseNotesService;
