import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tonyneuhold.mesopro',
  appName: 'MesoPro',
  webDir: 'build',
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
