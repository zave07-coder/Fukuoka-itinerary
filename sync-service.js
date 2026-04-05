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
    this.syncCallbacks = []; // Support multiple listeners
  }

  /**
   * Get or create unique device ID
   */
  getOrCreateDeviceId() {
    let deviceId = localStorage.getItem('wahgola_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('wahgola_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Start auto-sync (every 5 minutes)
   */
  startAutoSync() {
    if (this.autoSyncInterval) return;

    this.autoSyncInterval = setInterval(async () => {
      if (authService.isAuthenticatedSync()) {
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

    if (!authService.isAuthenticatedSync()) {
      console.log('Cannot sync - user not authenticated');
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Starting sync...');

    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('No access token');

      // Get all local trips
      const tripManager = new TripManager();
      const localTrips = tripManager.getAllTrips();
      console.log(`📤 Pushing ${localTrips.length} local trips to cloud...`);

      // Push local trips to cloud
      const pushPromises = localTrips.map(trip => this.pushTrip(trip, token));
      await Promise.all(pushPromises);
      console.log(`✅ Pushed ${localTrips.length} trips to cloud`);

      // Pull remote trips
      console.log('📥 Pulling trips from cloud...');
      await this.pullTrips(token);

      this.lastSyncTime = new Date();
      console.log('✅ Sync completed successfully');
      this.notifySyncComplete({ success: true, time: this.lastSyncTime });

    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.notifySyncComplete({ success: false, error });
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
        const errorData = await response.json();
        console.error('❌ Push trip error details:', errorData);
        throw new Error(errorData.error || 'Failed to push trip');
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Failed to push trip ${trip.id}:`, error);
      console.error('Trip data:', trip);
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
      console.log(`📥 Pulling ${cloudTrips.length} trips from cloud`);

      const tripManager = new TripManager();

      // Merge cloud trips into localStorage
      const data = tripManager._loadData();
      const localTripCount = data.trips.length;
      console.log(`💾 Current local trips: ${localTripCount}`);

      let newTrips = 0;
      let updatedTrips = 0;
      let skippedTrips = 0;

      for (const cloudTrip of cloudTrips) {
        const localTrip = tripManager.getTrip(cloudTrip.id);

        if (!localTrip) {
          // New trip from cloud - add it
          const tripData = {
            ...cloudTrip.data,
            id: cloudTrip.id,
            cloudSynced: true,
            lastSyncAt: new Date().toISOString()
          };
          data.trips.push(tripData);
          newTrips++;
          console.log(`➕ Added new trip from cloud: ${tripData.name}`);
        } else {
          // Conflict resolution: cloud wins if newer
          const cloudUpdated = new Date(cloudTrip.updated_at);
          const localUpdated = new Date(localTrip.updatedAt);

          if (cloudUpdated > localUpdated) {
            tripManager.updateTrip(cloudTrip.id, {
              ...cloudTrip.data,
              cloudSynced: true,
              lastSyncAt: new Date().toISOString()
            });
            updatedTrips++;
            console.log(`🔄 Updated trip from cloud (cloud newer): ${cloudTrip.data.name}`);
          } else {
            skippedTrips++;
            console.log(`⏭️ Skipped trip (local newer): ${localTrip.name}`);
          }
        }
      }

      // Save new trips to localStorage
      tripManager._saveData(data);
      console.log(`✅ Pull complete: ${newTrips} new, ${updatedTrips} updated, ${skippedTrips} skipped`);

    } catch (error) {
      console.error('Failed to pull trips:', error);
      throw error;
    }
  }

  /**
   * Migrate localStorage trips to cloud on first login
   * Uses user-specific migration key to ensure each device syncs properly
   */
  async migrateLocalTripsToCloud() {
    if (!authService.isAuthenticatedSync()) return;

    const user = authService.getCurrentUser();
    if (!user) return;

    // Use user-specific migration key so each user's first login triggers sync
    const migrationKey = `wahgola_migration_done_${user.id}`;
    if (localStorage.getItem(migrationKey)) {
      console.log('Migration already completed for this user');
      // Still do a sync to pull latest data
      await this.syncAll();
      return;
    }

    try {
      console.log('Migrating local trips to cloud for user:', user.email);
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
      authenticated: authService.isAuthenticatedSync()
    };
  }

  /**
   * Notify all registered callbacks of sync completion
   */
  notifySyncComplete(result) {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('Sync callback error:', error);
      }
    });
  }

  /**
   * Register sync completion callback
   */
  onSyncComplete(callback) {
    if (typeof callback === 'function') {
      this.syncCallbacks.push(callback);
    }
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
