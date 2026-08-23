import capacitorConfig from '../../capacitor.config';
import androidProjectService from '../services/AndroidProject.service';
import playReleaseService from './PlayRelease.service';
import releaseNotesService from './ReleaseNotes.service';
import { PlayTrack } from './types';

/**
 * Where merges land. Switch to `PlayTrack.ClosedTesting` once the 12-tester
 * cohort is assembled and the 14-day clock starts, so the closed track keeps
 * receiving builds without a Play Console visit.
 */
const TARGET_TRACK = PlayTrack.InternalTesting;

const main = async (): Promise<void> => {
  const { appId } = capacitorConfig;
  if (!appId) {
    throw new Error('capacitor.config.ts has no appId, so there is no package to publish to.');
  }

  await playReleaseService.publish({
    packageName: appId,
    bundlePath: androidProjectService.aabPath,
    track: TARGET_TRACK,
    description: releaseNotesService.read()
  });
};

await main();
