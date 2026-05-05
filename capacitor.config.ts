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
    }
  }
};

export default config;
