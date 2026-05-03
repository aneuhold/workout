import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tonyneuhold.mesopro',
  appName: 'MesoPro',
  webDir: 'build',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      // Matches what is in scripts/generate-icons-android.ts
      backgroundColor: '#0a1814'
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
