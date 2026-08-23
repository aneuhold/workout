/**
 * Everything needed to put one bundle on one track.
 */
export type PlayReleaseRequest = {
  packageName: string;
  bundlePath: string;
  track: PlayTrack;
  description: ReleaseDescription;
};

/**
 * Play track identifiers accepted by `edits.tracks.update`. These four are the
 * tracks this app has. Additional closed testing tracks created in Play Console
 * carry custom names and would be added here.
 *
 * @see https://developers.google.com/android-publisher/tracks
 */
export enum PlayTrack {
  InternalTesting = 'internal',
  ClosedTesting = 'alpha',
  OpenTesting = 'beta',
  Production = 'production'
}

/**
 * How a release identifies itself in Play Console.
 */
export type ReleaseDescription = {
  name: string;
  notes: string;
};
