/**
 * Sync Service
 * Handles synchronization between localStorage and cloud (Neon database)
 */

class SyncService {
  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.autoSyncInterval = null;
  }

  /**
   * Get or create unique device ID
   */
  getOrCreateDeviceId() {
    let deviceId = localStorage.getItem('wayweave_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('wayweave_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Start auto-sync (every 5 minutes)
   */
  startAutoSync() {
    if (this.autoSyncInterval) return;

    this.autoSyncInterval = setInterval(async () => {
      if (authService.isAuthenticated()) {
        await this.syncAll();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
  }

  /**
   * Sync all trips (push local changes, pull remote changes)
   */
  async syncAll() {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    if (!authService.isAuthenticated()) {
      console.log('Cannot sync - user not authenticated');
      return;
    }

    this.syncInProgress = true;

    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('No access token');

      // Get all local trips
      const tripManager = new TripManager();
      const localTrips = tripManager.getAllTrips();

      // Push local trips to cloud
      const pushPromises = localTrips.map(trip => this.pushTrip(trip, token));
      await Promise.all(pushPromises);

      // Pull remote trips
      await this.pullTrips(token);

      this.lastSyncTime = new Date();
      this.onSyncComplete?.({ success: true, time: this.lastSyncTime });

    } catch (error) {
      console.error('Sync failed:', error);
      this.onSyncComplete?.({ success: false, error });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Push a single trip to cloud
   */
  async pushTrip(trip, token) {
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tripId: trip.id,
          name: trip.name,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          coverImage: trip.coverImage,
          data: trip,
          deviceId: this.deviceId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to push trip');
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to push trip ${trip.id}:`, error);
      throw error;
    }
  }

  /**
   * Pull all trips from cloud
   */
  async pullTrips(token) {
    try {
      const response = await fetch('/api/trips', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to pull trips');
      }

      const cloudTrips = await response.json();
      const tripManager = new TripManager();

      // Merge cloud trips into localStorage
      for (const cloudTrip of cloudTrips) {
        const localTrip = tripManager.getTrip(cloudTrip.id);

        if (!localTrip) {
          // New trip from cloud - add it
          tripManager.trips.set(cloudTrip.id, cloudTrip.data);
        } else {
          // Conflict resolution: cloud wins if newer
          const cloudUpdated = new Date(cloudTrip.updated_at);
          const localUpdated = new Date(localTrip.updatedAt);

          if (cloudUpdated > localUpdated) {
            tripManager.trips.set(cloudTrip.id, cloudTrip.data);
          }
        }
      }

      tripManager.saveToLocalStorage();

    } catch (error) {
      console.error('Failed to pull trips:', error);
      throw error;
    }
  }

  /**
   * Migrate localStorage trips to cloud on first login
   */
  async migrateLocalTripsToCloud() {
    if (!authService.isAuthenticated()) return;

    const migrationKey = 'wayweave_migration_done';
    if (localStorage.getItem(migrationKey)) {
      console.log('Migration already completed');
      return;
    }

    try {
      console.log('Migrating local trips to cloud...');
      await this.syncAll();
      localStorage.setItem(migrationKey, 'true');
      console.log('Migration complete');
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      syncing: this.syncInProgress,
      lastSync: this.lastSyncTime,
      deviceId: this.deviceId,
      authenticated: authService.isAuthenticated()
    };
  }

  /**
   * Register sync completion callback
   */
  onSyncComplete(callback) {
    this.onSyncComplete = callback;
  }
}

// Export singleton instance
const syncService = new SyncService();

// Auto-start sync when authenticated
if (typeof window !== 'undefined') {
  authService.onAuthStateChange((user) => {
    if (user) {
      syncService.migrateLocalTripsToCloud();
      syncService.startAutoSync();
    } else {
      syncService.stopAutoSync();
    }
  });
}
