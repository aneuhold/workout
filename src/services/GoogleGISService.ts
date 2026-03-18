import { GOOGLE_CLIENT_ID } from '@aneuhold/core-ts-db-lib';

/**
 * Google Identity Services SDK service. Lazily loads the GIS script and
 * provides methods for initializing the sign-in button and disabling
 * auto-select on logout.
 */
class GoogleGISService {
  private loadPromise: Promise<typeof google.accounts> | undefined;

  /**
   * Lazily loads the Google Identity Services SDK and returns the
   * `google.accounts` API.
   */
  private load(): Promise<typeof google.accounts> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => resolve(google.accounts);
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Initializes Google Sign-In and renders the branded button into the
   * given container element.
   *
   * @param container - The element to render the Google button into.
   * @param onCredential - Callback invoked with the credential response.
   */
  async renderButton(
    container: HTMLElement,
    onCredential: (response: google.accounts.id.CredentialResponse) => void
  ): Promise<void> {
    const accounts = await this.load();
    accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: onCredential
    });
    accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      width: container.offsetWidth
    });
  }

  /**
   * Prevents Google auto-sign-in on next visit. Silently no-ops if
   * the GIS SDK hasn't been loaded (e.g. user never used Google sign-in).
   */
  disableAutoSelect(): void {
    try {
      google.accounts.id.disableAutoSelect();
    } catch {
      // Google GIS may not be loaded if user didn't use Google sign-in
    }
  }
}

export default new GoogleGISService();
