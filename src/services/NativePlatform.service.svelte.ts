import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { mode } from 'mode-watcher';

/**
 * Bootstraps native-only UI lifecycle plugins (splash screen, status bar,
 * hardware back button). No-ops on web. Future phone-only behaviors with no
 * web equivalent (iOS included) belong here behind the same `isNativePlatform`
 * gate, with platform-specific branching only when iOS and Android genuinely
 * differ.
 */
class NativePlatformService {
  // Match `--sidebar` from global.css (TopBar's `bg-sidebar`).
  private static readonly statusBarBackgroundLight = '#fafafa';
  private static readonly statusBarBackgroundDark = '#18181b';

  private initialized = false;

  /**
   * Wires up native lifecycle plugins. Call once from the root layout's
   * onMount. Safe to call multiple times — only the first call has effect.
   */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    if (!Capacitor.isNativePlatform()) return;

    $effect.root(() => {
      $effect(() => {
        const isDark = mode.current === 'dark';
        StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
        StatusBar.setBackgroundColor({
          color: isDark
            ? NativePlatformService.statusBarBackgroundDark
            : NativePlatformService.statusBarBackgroundLight
        });
      });
    });

    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        void App.exitApp();
      }
    });

    void SplashScreen.hide();
  }
}

const nativePlatformService = new NativePlatformService();
export default nativePlatformService;
