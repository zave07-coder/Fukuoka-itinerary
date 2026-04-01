/**
 * Auth Prompt - Shows prompts to encourage users to sign in for cloud sync
 */

class AuthPrompt {
  constructor() {
    this.shown = false;
    this.dismissedAt = null;
    this.tripCount = 0;
    this.usageTime = 0;
    this.startTime = Date.now();
  }

  /**
   * Initialize and start tracking
   */
  init() {
    // Load dismissed state
    const dismissed = localStorage.getItem('auth_prompt_dismissed');
    if (dismissed) {
      this.dismissedAt = new Date(dismissed);
    }

    // Track usage time
    setInterval(() => {
      this.usageTime += 1000; // Add 1 second
      this.checkConditions();
    }, 1000);

    // Check conditions on trip changes
    window.addEventListener('storage', () => {
      this.checkConditions();
    });
  }

  /**
   * Check if prompt should be shown
   */
  async checkConditions() {
    // Don't show if already authenticated (use async check)
    if (typeof authService !== 'undefined') {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        return;
      }
    }

    // Don't show if recently dismissed (within 24 hours)
    if (this.dismissedAt) {
      const hoursSinceDismiss = (Date.now() - this.dismissedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) {
        return;
      }
    }

    // Don't show if already showing
    if (this.shown) {
      return;
    }

    // Get current trip count
    const tripManager = new TripManager();
    this.tripCount = tripManager.getAllTrips().length;

    // Show after 5 minutes of usage OR after creating 2nd trip
    const fiveMinutes = 5 * 60 * 1000;
    if (this.usageTime >= fiveMinutes || this.tripCount >= 2) {
      this.showPrompt();
    }
  }

  /**
   * Show the auth prompt banner
   */
  showPrompt() {
    this.shown = true;

    const banner = document.createElement('div');
    banner.id = 'authBanner';
    banner.className = 'auth-banner';
    banner.innerHTML = `
      <button class="auth-banner-close" onclick="authPrompt.dismiss()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="auth-banner-content">
        <div class="auth-banner-icon">💾</div>
        <div class="auth-banner-text">
          <h3 class="auth-banner-title">Save Your Trips to the Cloud</h3>
          <p class="auth-banner-message">
            ${this.getMessage()}
          </p>
        </div>
        <div class="auth-banner-actions">
          <button class="btn-primary" onclick="authPrompt.signIn()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            </svg>
            Sign In with Google
          </button>
          <button class="btn-secondary" onclick="authPrompt.dismiss()">
            Maybe Later
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Track impression
    this.trackEvent('auth_prompt_shown');
  }

  /**
   * Get personalized message based on usage
   */
  getMessage() {
    if (this.tripCount >= 3) {
      return `You've created ${this.tripCount} trips! Sign in to access them from any device and never lose your progress.`;
    } else if (this.tripCount === 2) {
      return 'You have 2 trips saved locally. Sign in to sync them across devices and keep them safe.';
    } else {
      return 'Access your trips from any device and never lose your progress. Sync takes seconds.';
    }
  }

  /**
   * Sign in action
   */
  signIn() {
    this.trackEvent('auth_prompt_accepted');
    window.location.href = 'login.html';
  }

  /**
   * Dismiss action
   */
  dismiss() {
    const banner = document.getElementById('authBanner');
    if (banner) {
      banner.style.animation = 'slideDown 0.3s ease reverse';
      setTimeout(() => banner.remove(), 300);
    }

    this.dismissedAt = new Date();
    localStorage.setItem('auth_prompt_dismissed', this.dismissedAt.toISOString());
    this.shown = false;

    this.trackEvent('auth_prompt_dismissed');
  }

  /**
   * Show before user leaves (beforeunload)
   */
  showExitPrompt() {
    if (this.tripCount > 0 && !authService?.isAuthenticatedSync()) {
      return '⚠️ Your trips are only saved locally. Sign in to save them to the cloud?';
    }
  }

  /**
   * Track events (analytics placeholder)
   */
  trackEvent(eventName) {
    console.log(`[AuthPrompt] ${eventName}`, {
      tripCount: this.tripCount,
      usageTime: Math.floor(this.usageTime / 1000),
      dismissed: !!this.dismissedAt
    });

    // TODO: Send to analytics service
  }
}

// Export singleton
const authPrompt = new AuthPrompt();

// Auto-initialize
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    authPrompt.init();
  });

  // Beforeunload warning disabled - trips auto-save to localStorage
  // and users can manually save to cloud when needed.
  // The warning was causing UX issues with internal navigation.
  /*
  window.addEventListener('beforeunload', (e) => {
    const message = authPrompt.showExitPrompt();
    if (message) {
      e.preventDefault();
      e.returnValue = message;
      return message;
    }
  });
  */
}
