import type { CapacitorConfig } from '@capacitor/cli';
import browserSupportService from './scripts/services/BrowserSupport.service';

const config: CapacitorConfig = {
  appId: 'com.tonyneuhold.mesopro',
  appName: 'MesoPro',
  webDir: 'build',
  android: {
    // Older WebViews are shown `server.errorPath` instead of the app.
    minWebViewVersion: Number(browserSupportService.supportedBrowsers.chrome)
  },
  server: {
    // Relative to `webDir`. Also shown when the app's main page fails to load.
    errorPath: 'unsupported-webview.html'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false
    },
    StatusBar: {
      overlaysWebView: false,
      // Matches `--sidebar` (dark) from global.css; runtime updates this on mode change.
      backgroundColor: '#18181b',
      style: 'DARK'
    },
    SocialLogin: {
      // We only use Google. Disabling Facebook drops the Facebook SDK
      // transitive dependency (which would force a third-party data-sharing
      // disclosure on Play Data Safety). Apple/Twitter are unused.
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false
      }
    }
  }
};

export default config;
