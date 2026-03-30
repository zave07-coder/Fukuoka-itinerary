/**
 * Storage Monitor - Tracks localStorage usage and warns when approaching quota
 */

class StorageMonitor {
  constructor() {
    this.warningThreshold = 0.80; // 80% full
    this.criticalThreshold = 0.95; // 95% full
    this.checkInterval = null;
  }

  /**
   * Get current localStorage usage stats
   */
  getUsageStats() {
    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }

      // Most browsers limit localStorage to 5-10MB
      // We'll assume 5MB (5 * 1024 * 1024 bytes)
      const quotaSize = 5 * 1024 * 1024;
      const usedPercent = totalSize / quotaSize;

      return {
        used: totalSize,
        quota: quotaSize,
        usedPercent: usedPercent,
        usedMB: (totalSize / (1024 * 1024)).toFixed(2),
        quotaMB: (quotaSize / (1024 * 1024)).toFixed(2),
        remaining: quotaSize - totalSize,
        remainingMB: ((quotaSize - totalSize) / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  }

  /**
   * Check if storage is approaching quota
   */
  checkQuota() {
    const stats = this.getUsageStats();
    if (!stats) return;

    if (stats.usedPercent >= this.criticalThreshold) {
      this.showCriticalWarning(stats);
    } else if (stats.usedPercent >= this.warningThreshold) {
      this.showWarning(stats);
    }
  }

  /**
   * Show warning banner
   */
  showWarning(stats) {
    // Check if warning already shown today
    const lastWarning = localStorage.getItem('storage_warning_shown');
    const today = new Date().toDateString();

    if (lastWarning === today) return;

    this.displayBanner(
      'warning',
      `⚠️ Storage Almost Full: ${stats.usedMB} MB / ${stats.quotaMB} MB used (${(stats.usedPercent * 100).toFixed(0)}%)`,
      `You have ${stats.remainingMB} MB remaining. Consider signing in to sync your trips to the cloud.`,
      [
        { text: 'Sign In to Sync', action: () => window.location.href = 'login.html', primary: true },
        { text: 'Dismiss', action: () => this.dismissWarning(today) }
      ]
    );
  }

  /**
   * Show critical warning
   */
  showCriticalWarning(stats) {
    this.displayBanner(
      'critical',
      `🚨 Storage Critical: ${stats.usedMB} MB / ${stats.quotaMB} MB used (${(stats.usedPercent * 100).toFixed(0)}%)`,
      `You may not be able to save changes. Please delete old trips or sign in to sync to the cloud.`,
      [
        { text: 'Sign In Now', action: () => window.location.href = 'login.html', primary: true },
        { text: 'Manage Trips', action: () => window.location.href = 'dashboard-v2.html' }
      ]
    );
  }

  /**
   * Display banner UI
   */
  displayBanner(type, title, message, actions) {
    // Remove existing banner if present
    const existing = document.getElementById('storageBanner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'storageBanner';
    banner.className = `storage-banner storage-banner-${type}`;
    banner.innerHTML = `
      <div class="storage-banner-content">
        <div class="storage-banner-text">
          <strong class="storage-banner-title">${title}</strong>
          <p class="storage-banner-message">${message}</p>
        </div>
        <div class="storage-banner-actions">
          ${actions.map(action => `
            <button class="btn-${action.primary ? 'primary' : 'secondary'} btn-small" onclick="storageMonitor.handleAction('${action.text}')">
              ${action.text}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    document.body.insertBefore(banner, document.body.firstChild);

    // Store action handlers
    this.actionHandlers = {};
    actions.forEach(action => {
      this.actionHandlers[action.text] = action.action;
    });
  }

  /**
   * Handle banner action clicks
   */
  handleAction(actionText) {
    const handler = this.actionHandlers[actionText];
    if (handler) handler();

    const banner = document.getElementById('storageBanner');
    if (banner) banner.remove();
  }

  /**
   * Dismiss warning for today
   */
  dismissWarning(today) {
    localStorage.setItem('storage_warning_shown', today);
  }

  /**
   * Start periodic monitoring
   */
  startMonitoring() {
    // Check immediately
    this.checkQuota();

    // Check every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkQuota();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Get formatted storage info for display
   */
  getStorageInfo() {
    const stats = this.getUsageStats();
    if (!stats) return 'Storage info unavailable';

    return `Using ${stats.usedMB} MB of ${stats.quotaMB} MB (${(stats.usedPercent * 100).toFixed(1)}%)`;
  }
}

// Export singleton
const storageMonitor = new StorageMonitor();

// Auto-start monitoring
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    storageMonitor.startMonitoring();
  });
}
