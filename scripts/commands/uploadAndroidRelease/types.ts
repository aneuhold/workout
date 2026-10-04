import type { androidpublisher_v3 } from '@googleapis/androidpublisher';

/**
 * Everything needed to put one bundle on one or more tracks.
 */
export type PlayReleaseRequest = {
  packageName: string;
  bundlePath: string;
  /** At least one track, so an upload always lands on a release. */
  tracks: [PlayTrack, ...PlayTrack[]];
  /** How the release identifies itself in Play Console. */
  release: Pick<androidpublisher_v3.Schema$TrackRelease, 'name' | 'releaseNotes'>;
};

/**
 * Play track identifiers accepted by `edits.tracks.update`, which types a track
 * as a plain `string`. These four are the tracks this app has. Additional
 * closed testing tracks created in Play Console carry custom names and would be
 * added here.
 *
 * @see https://developers.google.com/android-publisher/tracks
 */
export enum PlayTrack {
  InternalTesting = 'internal',
  ClosedTesting = 'alpha',
  OpenTesting = 'beta',
  Production = 'production'
}
