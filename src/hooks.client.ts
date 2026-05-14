import { Capacitor } from '@capacitor/core';
import * as SentryCapacitor from '@sentry/capacitor';
import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry } from '@sentry/sveltekit';
import localOverride from '$util/localOverride';
import { LogLevel, setLogSink } from '$util/logging/logger';

// Override API URL for local development before anything else runs
localOverride();

const debugSentry = false;
// This has the issue where it will always log to Sentry when testing mobile, but just didn't
// have the motivation at the time to figure out the ENV variable situation. This should be fixed
// though.
const initializeSentry =
  Capacitor.isNativePlatform() ||
  (window.location.hostname !== 'localhost' && !window.location.hostname.includes('netlify.app')) ||
  debugSentry;

/**
 * Username is set in the `loginState` store. That seemed like the best source
 * of truth because it is always called on startup and when logging in.
 */
if (initializeSentry) {
  const sentryOptions = {
    dsn: 'https://d2be0b33224daa1b4da3c30d5163f89a@o4507319328702464.ingest.us.sentry.io/4510925034618880',
    tracesSampleRate: 1.0,
    tracePropagationTargets: ['https://api.antonneuhold.com'],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    ignoreSpans: [
      // Socket.IO long-polling spans are constant noise
      { op: 'http.client', name: /socket\.io/ },
      // SvelteKit code-split JS chunks loaded via dynamic import()
      { op: 'resource.other', name: /\.js/ },
      // Browser connection timing — low signal, high volume
      { op: /^browser\.(cache|connect|DNS|TLS\/SSL)$/ }
    ]
  };

  if (Capacitor.isNativePlatform()) {
    SentryCapacitor.init(sentryOptions, Sentry.init);
  } else {
    Sentry.init(sentryOptions);
  }

  setLogSink((entry) => {
    if (entry.level !== LogLevel.Error) return;

    Sentry.withScope((scope) => {
      // Makes it so that you can filter by `logger_tag: HomePage.svelte` for example in Sentry.
      scope.setTag('logger_tag', entry.tag);
      const extras: Record<string, unknown> = {};
      entry.args.forEach((arg, i) => {
        extras[`arg${i}`] = arg;
      });
      scope.setExtras(extras);

      const errorArg = entry.args.find((a) => a instanceof Error);
      if (errorArg instanceof Error) {
        Sentry.captureException(errorArg);
      } else {
        Sentry.captureMessage(`[${entry.tag}] ${entry.message}`, 'error');
      }
    });
  });
}

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
