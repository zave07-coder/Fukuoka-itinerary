/**
 * TripManager - Central data layer for Wahgola multi-trip system
 * Handles all localStorage CRUD operations and data migration
 */

class TripManager {
  constructor() {
    this.storageKey = 'wahgola_trips';
    this.legacyKey = 'fukuokaItinerary';
    this.version = '1.0';

    // Auto-migrate on first instantiation
    this.migrateFromLegacy();
  }

  /**
   * Get all trips from localStorage
   * @returns {Array} Array of trip objects
   */
  getAllTrips() {
    try {
      const data = this._loadData();
      return data.trips || [];
    } catch (error) {
      console.error('Error loading trips:', error);
      return [];
    }
  }

  /**
   * Get a single trip by ID
   * @param {string} id - Trip ID
   * @returns {Object|null} Trip object or null if not found
   */
  getTrip(id) {
    const trips = this.getAllTrips();
    return trips.find(trip => trip.id === id) || null;
  }

  /**
   * Create a new trip
   * @param {Object} tripData - Trip data (name, destination, dates, etc.)
   * @returns {Object} Created trip with generated ID
   */
  createTrip(tripData) {
    try {
      const data = this._loadData();

      const newTrip = {
        id: this._generateId(),
        name: tripData.name || 'Untitled Trip',
        destination: tripData.destination || '',
        startDate: tripData.startDate || '',
        endDate: tripData.endDate || '',
        coverImage: tripData.coverImage || this._getDefaultCoverImage(),
        days: tripData.days || [],
        // Preserve additional AI-generated fields
        summary: tripData.summary,
        highlights: tripData.highlights,
        aiGenerated: tripData.aiGenerated,
        generatedBy: tripData.generatedBy,
        generatedAt: tripData.generatedAt,
        currency: tripData.currency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('[TripManager] Creating trip:', {
        id: newTrip.id,
        name: newTrip.name,
        destination: newTrip.destination,
        daysCount: newTrip.days?.length,
        hasSummary: !!newTrip.summary
      });

      data.trips.push(newTrip);
      data.currentTripId = newTrip.id;

      this._saveData(data);

      console.log('[TripManager] Trip saved successfully. Total trips:', data.trips.length);

      return newTrip;
    } catch (error) {
      console.error('[TripManager] Error creating trip:', error);
      throw error;
    }
  }

  /**
   * Update an existing trip
   * @param {string} id - Trip ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated trip or null if not found
   */
  updateTrip(id, updates) {
    try {
      const data = this._loadData();
      const tripIndex = data.trips.findIndex(trip => trip.id === id);

      if (tripIndex === -1) {
        console.error('Trip not found:', id);
        return null;
      }

      // Merge updates and set updatedAt
      data.trips[tripIndex] = {
        ...data.trips[tripIndex],
        ...updates,
        id, // Ensure ID cannot be changed
        updatedAt: new Date().toISOString()
      };

      this._saveData(data);
      return data.trips[tripIndex];
    } catch (error) {
      console.error('Error updating trip:', error);
      throw error;
    }
  }

  /**
   * Delete a trip
   * @param {string} id - Trip ID
   * @returns {boolean} True if deleted, false if not found
   */
  async deleteTrip(id) {
    try {
      const data = this._loadData();
      const initialLength = data.trips.length;

      // Delete from local storage
      data.trips = data.trips.filter(trip => trip.id !== id);

      // If current trip was deleted, set to first available trip
      if (data.currentTripId === id) {
        data.currentTripId = data.trips.length > 0 ? data.trips[0].id : null;
      }

      this._saveData(data);

      // Also delete from cloud if user is authenticated
      if (typeof authService !== 'undefined') {
        try {
          const isAuth = await authService.isAuthenticated();
          if (isAuth) {
            const token = await authService.getAccessToken();
            const response = await fetch('/api/trips', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ tripId: id })
            });

            if (response.ok) {
              console.log(`✅ Trip ${id} deleted from cloud`);
            } else {
              console.warn(`⚠️ Failed to delete trip ${id} from cloud:`, await response.text());
            }
          }
        } catch (cloudError) {
          console.warn('Failed to delete from cloud (offline?):', cloudError);
          // Continue anyway - local delete succeeded
        }
      }

      return data.trips.length < initialLength;
    } catch (error) {
      console.error('Error deleting trip:', error);
      throw error;
    }
  }

  /**
   * Duplicate an existing trip
   * @param {string} id - Trip ID to duplicate
   * @returns {Object|null} New trip object or null if original not found
   */
  duplicateTrip(id) {
    try {
      const originalTrip = this.getTrip(id);

      if (!originalTrip) {
        console.error('Trip not found for duplication:', id);
        return null;
      }

      const duplicatedTrip = {
        ...originalTrip,
        id: this._generateId(),
        name: `${originalTrip.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const data = this._loadData();
      data.trips.push(duplicatedTrip);
      this._saveData(data);

      return duplicatedTrip;
    } catch (error) {
      console.error('Error duplicating trip:', error);
      throw error;
    }
  }

  /**
   * Get current trip ID
   * @returns {string|null}
   */
  getCurrentTripId() {
    const data = this._loadData();
    return data.currentTripId || null;
  }

  /**
   * Set current trip ID
   * @param {string} id - Trip ID
   */
  setCurrentTripId(id) {
    const data = this._loadData();
    data.currentTripId = id;
    this._saveData(data);
  }

  /**
   * Get settings
   * @returns {Object}
   */
  getSettings() {
    const data = this._loadData();
    return data.settings || { theme: 'light', autoSave: true };
  }

  /**
   * Update settings
   * @param {Object} updates - Settings to update
   */
  updateSettings(updates) {
    const data = this._loadData();
    data.settings = {
      ...data.settings,
      ...updates
    };
    this._saveData(data);
  }

  /**
   * Check localStorage usage
   * @returns {Object} Storage info with used/total bytes and percentage
   */
  getStorageInfo() {
    try {
      const total = 5 * 1024 * 1024; // 5MB typical limit
      const used = new Blob(Object.values(localStorage)).size;
      const percentage = (used / total) * 100;

      return {
        used,
        total,
        percentage,
        isNearLimit: percentage > 90
      };
    } catch (error) {
      console.error('Error checking storage:', error);
      return { used: 0, total: 0, percentage: 0, isNearLimit: false };
    }
  }

  /**
   * Migrate from legacy single-trip format
   * Automatically converts old 'fukuokaItinerary' data to new multi-trip format
   */
  migrateFromLegacy() {
    // Check if already migrated
    if (localStorage.getItem(this.storageKey)) {
      return;
    }

    const legacyData = localStorage.getItem(this.legacyKey);

    if (!legacyData) {
      // No legacy data, initialize fresh
      this._initializeFreshStorage();
      return;
    }

    try {
      console.log('🔄 Migrating from legacy format...');

      const parsed = JSON.parse(legacyData);

      // Create backup before migration
      localStorage.setItem(`${this.legacyKey}_backup`, legacyData);

      // Transform to new format
      const migratedTrip = {
        id: `legacy-${Date.now()}`,
        name: 'Fukuoka Family Adventure',
        destination: 'Fukuoka, Japan',
        startDate: '2026-06-14',
        endDate: '2026-06-23',
        coverImage: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800',
        days: parsed.days || parsed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save in new format
      const newData = {
        version: this.version,
        trips: [migratedTrip],
        currentTripId: migratedTrip.id,
        settings: {
          theme: 'light',
          autoSave: true
        }
      };

      this._saveData(newData);

      console.log('✅ Migration successful! Legacy data backed up to:', `${this.legacyKey}_backup`);
    } catch (error) {
      console.error('❌ Migration failed:', error);
      this._initializeFreshStorage();
    }
  }

  /**
   * Export all trips as JSON
   * @returns {string} JSON string of all trip data
   */
  exportData() {
    const data = this._loadData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import trips from JSON
   * @param {string} jsonString - JSON data to import
   * @param {boolean} merge - If true, merge with existing trips; if false, replace
   */
  importData(jsonString, merge = false) {
    try {
      const importedData = JSON.parse(jsonString);

      if (!importedData.trips || !Array.isArray(importedData.trips)) {
        throw new Error('Invalid data format');
      }

      if (merge) {
        const currentData = this._loadData();
        currentData.trips = [...currentData.trips, ...importedData.trips];
        this._saveData(currentData);
      } else {
        this._saveData(importedData);
      }

      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Save trip to cloud (Supabase)
   * @param {string} tripId - Trip ID to save
   * @param {string} authToken - Supabase auth token
   * @returns {Promise<Object>} Saved trip data
   */
  async saveTripToCloud(tripId, authToken) {
    try {
      const trip = this.getTrip(tripId);

      if (!trip) {
        throw new Error('Trip not found');
      }

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          tripId: trip.id,
          name: trip.name,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          coverImage: trip.coverImage,
          data: trip,
          deviceId: this._getDeviceId()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save trip to cloud');
      }

      const savedTrip = await response.json();

      // Update local trip with cloud sync metadata
      this.updateTrip(tripId, {
        cloudSynced: true,
        lastSyncAt: new Date().toISOString()
      });

      return savedTrip;
    } catch (error) {
      console.error('Error saving trip to cloud:', error);
      throw error;
    }
  }

  /**
   * Load trips from cloud (Supabase)
   * @param {string} authToken - Supabase auth token
   * @returns {Promise<Array>} Array of trips from cloud
   */
  async loadTripsFromCloud(authToken) {
    try {
      const response = await fetch('/api/trips', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load trips from cloud');
      }

      const cloudTrips = await response.json();
      return cloudTrips;
    } catch (error) {
      console.error('Error loading trips from cloud:', error);
      throw error;
    }
  }

  /**
   * Sync all trips with cloud (bi-directional)
   * @param {string} authToken - Supabase auth token
   * @returns {Promise<Object>} Sync results
   */
  async syncWithCloud(authToken) {
    try {
      const localTrips = this.getAllTrips();
      const cloudTrips = await this.loadTripsFromCloud(authToken);

      const results = {
        uploaded: 0,
        downloaded: 0,
        conflicts: 0
      };

      // Upload local trips that don't exist in cloud or are newer
      for (const localTrip of localTrips) {
        const cloudTrip = cloudTrips.find(t => t.id === localTrip.id);

        if (!cloudTrip || new Date(localTrip.updatedAt) > new Date(cloudTrip.updated_at)) {
          await this.saveTripToCloud(localTrip.id, authToken);
          results.uploaded++;
        }
      }

      // Download cloud trips that don't exist locally or are newer
      for (const cloudTrip of cloudTrips) {
        const localTrip = this.getTrip(cloudTrip.id);

        if (!localTrip) {
          // New trip from cloud
          this.createTrip({
            ...cloudTrip.data,
            id: cloudTrip.id,
            cloudSynced: true,
            lastSyncAt: new Date().toISOString()
          });
          results.downloaded++;
        } else if (new Date(cloudTrip.updated_at) > new Date(localTrip.updatedAt)) {
          // Cloud version is newer
          this.updateTrip(cloudTrip.id, {
            ...cloudTrip.data,
            cloudSynced: true,
            lastSyncAt: new Date().toISOString()
          });
          results.downloaded++;
        }
      }

      return results;
    } catch (error) {
      console.error('Error syncing with cloud:', error);
      throw error;
    }
  }

  /**
   * Get or generate device ID for sync tracking
   * @private
   */
  _getDeviceId() {
    let deviceId = localStorage.getItem('wahgola_device_id');

    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('wahgola_device_id', deviceId);
    }

    return deviceId;
  }

  // ========== Private Methods ==========

  /**
   * Load data from localStorage
   * @private
   */
  _loadData() {
    const data = localStorage.getItem(this.storageKey);

    if (!data) {
      return this._getDefaultStructure();
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing localStorage data:', error);
      return this._getDefaultStructure();
    }
  }

  /**
   * Save data to localStorage
   * @private
   */
  _saveData(data) {
    try {
      const jsonString = JSON.stringify(data);
      localStorage.setItem(this.storageKey, jsonString);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded!');
        throw new Error('Storage quota exceeded. Please delete some trips.');
      }
      throw error;
    }
  }

  /**
   * Initialize fresh storage
   * @private
   */
  _initializeFreshStorage() {
    const freshData = this._getDefaultStructure();
    this._saveData(freshData);
  }

  /**
   * Get default storage structure
   * @private
   */
  _getDefaultStructure() {
    return {
      version: this.version,
      trips: [],
      currentTripId: null,
      settings: {
        theme: 'light',
        autoSave: true
      }
    };
  }

  /**
   * Generate unique trip ID (UUID format for Supabase compatibility)
   * @private
   */
  _generateId() {
    // Use crypto.randomUUID() if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback: Generate UUID v4 format manually
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get default cover image
   * @private
   */
  _getDefaultCoverImage() {
    const defaultImages = [
      'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800', // Fukuoka
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', // Seoul
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', // Tokyo
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', // Paris
      'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=800'  // Barcelona
    ];

    return defaultImages[Math.floor(Math.random() * defaultImages.length)];
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TripManager;
}
