/**
 * PWA Installer & Service Worker Registration
 * Handles app installation and offline support
 */

class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isIOS = this.detectIOS();
    this.installButton = null;

    this.init();
  }

  /**
   * Initialize PWA features
   */
  async init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      this.registerServiceWorker();
    }

    // Setup install prompt
    this.setupInstallPrompt();

    // Check if already installed
    this.checkIfInstalled();

    // Show iOS install instructions if needed
    if (this.isIOS && !this.isInstalled) {
      this.setupIOSPrompt();
    }
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[PWA] Service worker registered:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New version available!');
            this.showUpdateNotification();
          }
        });
      });

      // Check for updates every hour
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
    }
  }

  /**
   * Setup install prompt for Android/Desktop
   */
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Install prompt available');

      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();

      // Store the event for later use
      this.deferredPrompt = e;

      // Show custom install button
      this.showInstallButton();
    });

    // Track successful install
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.isInstalled = true;
      this.hideInstallButton();
      this.deferredPrompt = null;

      // Track analytics (future)
      this.trackEvent('pwa_installed');
    });
  }

  /**
   * Show install button
   */
  showInstallButton() {
    // Don't show if already installed
    if (this.isInstalled) return;

    // Create install button if it doesn't exist
    if (!this.installButton) {
      this.installButton = this.createInstallButton();
      document.body.appendChild(this.installButton);
    }

    // Show button with animation
    setTimeout(() => {
      this.installButton.classList.add('visible');
    }, 2000); // Show after 2 seconds
  }

  /**
   * Hide install button
   */
  hideInstallButton() {
    if (this.installButton) {
      this.installButton.classList.remove('visible');
      setTimeout(() => {
        this.installButton?.remove();
        this.installButton = null;
      }, 300);
    }
  }

  /**
   * Create install button element
   */
  createInstallButton() {
    const button = document.createElement('button');
    button.className = 'pwa-install-btn';
    button.innerHTML = `
      <span class="pwa-install-icon">📱</span>
      <span class="pwa-install-text">
        <strong>Install Wahgola</strong>
        <small>Quick access from your home screen</small>
      </span>
      <span class="pwa-install-close" aria-label="Dismiss">&times;</span>
    `;

    // Click handler
    button.addEventListener('click', (e) => {
      if (e.target.classList.contains('pwa-install-close')) {
        this.dismissInstallPrompt();
      } else {
        this.showInstallDialog();
      }
    });

    return button;
  }

  /**
   * Show install dialog
   */
  async showInstallDialog() {
    if (!this.deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await this.deferredPrompt.userChoice;

    console.log('[PWA] Install prompt outcome:', outcome);

    if (outcome === 'accepted') {
      this.trackEvent('pwa_install_accepted');
    } else {
      this.trackEvent('pwa_install_dismissed');
    }

    // Clear the prompt
    this.deferredPrompt = null;
    this.hideInstallButton();
  }

  /**
   * Dismiss install prompt
   */
  dismissInstallPrompt() {
    this.hideInstallButton();

    // Don't show again for 7 days
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());

    this.trackEvent('pwa_install_banner_dismissed');
  }

  /**
   * Check if should show install prompt
   */
  shouldShowInstallPrompt() {
    const dismissed = localStorage.getItem('pwa_install_dismissed');

    if (!dismissed) return true;

    const dismissedTime = parseInt(dismissed);
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    return daysSinceDismissed > 7; // Show again after 7 days
  }

  /**
   * Check if app is already installed
   */
  checkIfInstalled() {
    // Check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('[PWA] App is running in standalone mode');
      return;
    }

    // Check if launched from home screen (iOS)
    if (window.navigator.standalone === true) {
      this.isInstalled = true;
      console.log('[PWA] App launched from iOS home screen');
      return;
    }

    // Check related applications
    if ('getInstalledRelatedApps' in navigator) {
      navigator.getInstalledRelatedApps().then((apps) => {
        if (apps.length > 0) {
          this.isInstalled = true;
          console.log('[PWA] App is installed');
        }
      });
    }
  }

  /**
   * Detect iOS
   */
  detectIOS() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }

  /**
   * Setup iOS install instructions
   */
  setupIOSPrompt() {
    // Don't show if dismissed recently
    if (!this.shouldShowInstallPrompt()) return;

    // Only show on Safari (iOS Chrome doesn't support PWA install)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (!isSafari) return;

    // Show iOS-specific instructions
    setTimeout(() => {
      this.showIOSInstructions();
    }, 3000);
  }

  /**
   * Show iOS install instructions
   */
  showIOSInstructions() {
    const banner = document.createElement('div');
    banner.className = 'pwa-ios-banner';
    banner.innerHTML = `
      <div class="pwa-ios-content">
        <span class="pwa-ios-icon">📱</span>
        <div class="pwa-ios-text">
          <strong>Install Wahgola</strong>
          <p>Tap <svg width="14" height="18" fill="currentColor"><path d="M7 0l-3 3h2v8h2V3h2zM1 11v5h12v-5h-2v3H3v-3z"/></svg> then "Add to Home Screen"</p>
        </div>
        <button class="pwa-ios-close" aria-label="Dismiss">&times;</button>
      </div>
    `;

    banner.querySelector('.pwa-ios-close').addEventListener('click', () => {
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 300);
      this.dismissInstallPrompt();
    });

    document.body.appendChild(banner);

    setTimeout(() => {
      banner.classList.add('visible');
    }, 100);
  }

  /**
   * Show update notification
   */
  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'pwa-update-notification';
    notification.innerHTML = `
      <div class="pwa-update-content">
        <span class="pwa-update-icon">🔄</span>
        <div class="pwa-update-text">
          <strong>Update Available</strong>
          <p>A new version of Wahgola is ready</p>
        </div>
        <button class="pwa-update-btn">Update Now</button>
      </div>
    `;

    notification.querySelector('.pwa-update-btn').addEventListener('click', () => {
      // Tell service worker to skip waiting
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }

      // Reload page
      window.location.reload();
    });

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('visible');
    }, 100);
  }

  /**
   * Track analytics event
   */
  trackEvent(eventName, data = {}) {
    console.log('[PWA Analytics]', eventName, data);

    // TODO: Send to analytics service when enabled
    // window.gtag?.('event', eventName, data);
  }

  /**
   * Cache important resources
   */
  cacheResources(urls) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_URLS',
        urls: urls
      });
    }
  }
}

// Initialize PWA installer on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.pwaInstaller = new PWAInstaller();
  });
} else {
  window.pwaInstaller = new PWAInstaller();
}

// Export for manual control
window.PWAInstaller = PWAInstaller;
