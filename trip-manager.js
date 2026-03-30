/**
 * TripManager - Central data layer for WayWeave multi-trip system
 * Handles all localStorage CRUD operations and data migration
 */

class TripManager {
  constructor() {
    this.storageKey = 'wayweave_trips';
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      data.trips.push(newTrip);
      data.currentTripId = newTrip.id;

      this._saveData(data);
      return newTrip;
    } catch (error) {
      console.error('Error creating trip:', error);
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
  deleteTrip(id) {
    try {
      const data = this._loadData();
      const initialLength = data.trips.length;

      data.trips = data.trips.filter(trip => trip.id !== id);

      // If current trip was deleted, set to first available trip
      if (data.currentTripId === id) {
        data.currentTripId = data.trips.length > 0 ? data.trips[0].id : null;
      }

      this._saveData(data);
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
   * Generate unique trip ID
   * @private
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
