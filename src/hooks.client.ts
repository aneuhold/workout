import * as Sentry from '@sentry/sveltekit';
import { captureConsoleIntegration, handleErrorWithSentry } from '@sentry/sveltekit';
import localOverride from '$util/localOverride';

// Override API URL for local development before anything else runs
localOverride();

const debugSentry = false;
const initalizeSentry =
  (window.location.hostname !== 'localhost' && !window.location.hostname.includes('netlify.app')) ||
  debugSentry;

/**
 * Username is set in the `loginState` store. That seemed like the best source
 * of truth because it is always called on startup and when logging in.
 */
if (initalizeSentry) {
  Sentry.init({
    dsn: 'https://d2be0b33224daa1b4da3c30d5163f89a@o4507319328702464.ingest.us.sentry.io/4510925034618880',
    tracesSampleRate: 1.0,
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,
    // If the entire session is not sampled, use the below sample rate to sample
    // sessions when an error occurs.
    replaysOnErrorSampleRate: 1.0,
    // If you don't want to use Session Replay, just remove the line below:
    // integrations: [replayIntegration()]
    integrations: [
      captureConsoleIntegration({
        levels: ['error']
      })
    ]
  });
}

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
