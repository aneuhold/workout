import { androidpublisher, auth } from '@googleapis/androidpublisher';
import { createReadStream } from 'fs';
import type { PlayReleaseRequest } from './types';

/**
 * Publishes a bundle to Google Play through the Play Developer API edit
 * transaction.
 *
 * @see https://developers.google.com/android-publisher/edits
 */
class PlayReleaseService {
  /**
   * Opens an edit, uploads the bundle, assigns the version code it reports to
   * the target track, and commits. Nothing reaches the track until the commit,
   * so a failure part way through leaves the app as it was.
   *
   * Credentials come from Application Default Credentials, which CI and a
   * developer machine each supply their own way.
   *
   * @param request - The bundle, the track, and how the release identifies itself.
   * @param request.packageName - Play package name to publish under.
   * @param request.bundlePath - Absolute path of the AAB to upload.
   * @param request.track - Track the release is assigned to.
   * @param request.description - Release name and notes.
   */
  async publish({
    packageName,
    bundlePath,
    track,
    description
  }: PlayReleaseRequest): Promise<void> {
    const client = androidpublisher({
      version: 'v3',
      auth: new auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/androidpublisher'] })
    });

    const { data: edit } = await client.edits.insert({ packageName });
    const editId = this.#requireEditId(edit.id);
    console.log(`Opened edit ${editId} for ${packageName}.`);

    const { data: bundle } = await client.edits.bundles.upload({
      packageName,
      editId,
      media: {
        mimeType: 'application/octet-stream',
        body: createReadStream(bundlePath)
      }
    });
    const versionCode = this.#requireVersionCode(bundle.versionCode, bundlePath);
    console.log(`Uploaded ${bundlePath} as versionCode ${versionCode}.`);

    await client.edits.tracks.update({
      packageName,
      editId,
      track,
      requestBody: {
        releases: [
          {
            versionCodes: [String(versionCode)],
            // Fully rolled out to the track as soon as the edit commits.
            // `draft` uploads without rolling out, and `inProgress` / `halted`
            // are staged rollouts that also need a `userFraction`.
            status: 'completed',
            name: description.name,
            releaseNotes: [{ language: 'en-US', text: description.notes }]
          }
        ]
      }
    });
    console.log(`Assigned versionCode ${versionCode} to the ${track} track.`);

    await client.edits.commit({ packageName, editId });
    console.log(`Committed edit ${editId}.`);
  }

  /**
   * Narrows the edit identifier the API reports to the string every later call
   * in the transaction needs.
   *
   * @param editId - The identifier `edits.insert` returned.
   */
  #requireEditId(editId: string | null | undefined): string {
    if (!editId) {
      throw new Error('edits.insert returned no edit id.');
    }
    return editId;
  }

  /**
   * Narrows the version code the API read out of the uploaded bundle.
   *
   * @param versionCode - The code `edits.bundles.upload` returned.
   * @param bundlePath - Path of the uploaded bundle, for the error message.
   */
  #requireVersionCode(versionCode: number | null | undefined, bundlePath: string): number {
    if (!versionCode) {
      throw new Error(`Uploading ${bundlePath} returned no versionCode.`);
    }
    return versionCode;
  }
}

const playReleaseService = new PlayReleaseService();
export default playReleaseService;
