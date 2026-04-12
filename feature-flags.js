/**
 * Feature Flags Configuration
 * Centralized control for experimental/beta features
 */

const FEATURES = {
  // Booking integration (affiliate links + widgets)
  // Set to true when ready to monetize
  BOOKING_ENABLED: false,

  // PWA (Progressive Web App) - offline support
  PWA_ENABLED: false, // Coming soon

  // Trip sharing - public trip URLs
  TRIP_SHARING_ENABLED: false, // Coming soon

  // Export features (PDF, Calendar)
  EXPORT_ENABLED: false, // Coming soon

  // Analytics tracking
  ANALYTICS_ENABLED: false,

  // A/B testing
  AB_TESTING_ENABLED: false,

  // Beta features (for testing)
  BETA_FEATURES_ENABLED: false
};

/**
 * Check if a feature is enabled
 */
function isFeatureEnabled(featureName) {
  return FEATURES[featureName] === true;
}

/**
 * Enable a feature (for admin/testing)
 */
function enableFeature(featureName) {
  if (featureName in FEATURES) {
    FEATURES[featureName] = true;
    console.log(`[Feature] ${featureName} enabled`);

    // Update UI if needed
    updateFeatureUI();
  }
}

/**
 * Disable a feature
 */
function disableFeature(featureName) {
  if (featureName in FEATURES) {
    FEATURES[featureName] = false;
    console.log(`[Feature] ${featureName} disabled`);

    // Update UI if needed
    updateFeatureUI();
  }
}

/**
 * Update UI based on feature flags
 */
function updateFeatureUI() {
  // Booking feature
  if (isFeatureEnabled('BOOKING_ENABLED')) {
    document.body.classList.add('booking-feature-enabled');
  } else {
    document.body.classList.remove('booking-feature-enabled');
  }

  // Future features...
}

/**
 * Initialize features on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  updateFeatureUI();

  // Log enabled features in dev mode
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
    console.log('[Features] Enabled features:', Object.keys(FEATURES).filter(f => FEATURES[f]));
  }
});

// Admin console commands (for testing)
// Usage: enableFeature('BOOKING_ENABLED')
window.enableFeature = enableFeature;
window.disableFeature = disableFeature;
window.isFeatureEnabled = isFeatureEnabled;
