import capacitorConfig from '../../../capacitor.config';
import androidProjectService from '../../services/AndroidProject.service';
import playReleaseService from './PlayRelease.service';
import releaseNotesService from './ReleaseNotes.service';
import { PlayTrack } from './types';

/**
 * Where merges land. Every track receives the same build, so testers on any of
 * them stay current without a Play Console visit.
 */
const TARGET_TRACKS: PlayTrack[] = [PlayTrack.InternalTesting, PlayTrack.ClosedTesting];

const main = async (): Promise<void> => {
  const { appId } = capacitorConfig;
  if (!appId) {
    throw new Error('capacitor.config.ts has no appId, so there is no package to publish to.');
  }

  await playReleaseService.publish({
    packageName: appId,
    bundlePath: androidProjectService.aabPath,
    tracks: TARGET_TRACKS,
    description: releaseNotesService.read()
  });
};

await main();
