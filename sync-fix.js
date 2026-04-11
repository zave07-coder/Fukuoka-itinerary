/**
 * Sync Fix Utility
 * Common fixes for sync issues
 *
 * Usage in browser console:
 * 1. await forceSyncAll() - Force a full sync
 * 2. await repairSyncStatus() - Fix sync status markers
 * 3. await clearSyncAndResync() - Nuclear option: clear sync state and resync
 */

/**
 * Force a full sync (push all local, pull all cloud)
 */
async function forceSyncAll() {
  console.log('🔄 Force syncing all trips...');

  if (!authService.isAuthenticatedSync()) {
    console.error('❌ Not authenticated - please sign in first');
    return;
  }

  try {
    const token = await authService.getAccessToken();
    const tripManager = new TripManager();
    const localTrips = tripManager.getAllTrips();

    console.log(`📤 Pushing ${localTrips.length} local trips...`);

    // Push all local trips
    for (const trip of localTrips) {
      console.log(`  Pushing: ${trip.name}`);
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
          deviceId: syncService.deviceId
        })
      });

      if (response.ok) {
        // Mark as synced
        tripManager.updateTrip(trip.id, {
          cloudSynced: true,
          lastSyncAt: new Date().toISOString()
        });
        console.log(`    ✅ Pushed: ${trip.name}`);
      } else {
        const error = await response.text();
        console.error(`    ❌ Failed to push ${trip.name}:`, error);
      }
    }

    // Pull from cloud
    console.log('📥 Pulling trips from cloud...');
    const getResponse = await fetch('/api/trips', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (getResponse.ok) {
      const cloudTrips = await getResponse.json();
      console.log(`📥 Found ${cloudTrips.length} trips in cloud`);

      const data = tripManager._loadData();
      let newTrips = 0;
      let updatedTrips = 0;

      for (const cloudTrip of cloudTrips) {
        const localTrip = tripManager.getTrip(cloudTrip.id);

        if (!localTrip) {
          // New trip from cloud
          const tripData = {
            ...cloudTrip.data,
            id: cloudTrip.id,
            cloudSynced: true,
            lastSyncAt: new Date().toISOString()
          };
          data.trips.push(tripData);
          newTrips++;
          console.log(`  ➕ Added: ${tripData.name}`);
        } else {
          // Update if cloud is newer
          const cloudUpdated = new Date(cloudTrip.updated_at);
          const localUpdated = new Date(localTrip.updatedAt);

          if (cloudUpdated > localUpdated) {
            tripManager.updateTrip(cloudTrip.id, {
              ...cloudTrip.data,
              cloudSynced: true,
              lastSyncAt: new Date().toISOString()
            });
            updatedTrips++;
            console.log(`  🔄 Updated: ${cloudTrip.data.name}`);
          }
        }
      }

      tripManager._saveData(data);
      console.log(`✅ Sync complete: ${newTrips} new, ${updatedTrips} updated`);
      syncService.lastSyncTime = new Date();

      // Reload dashboard
      if (typeof loadTrips === 'function') {
        loadTrips();
      }

      return { success: true, newTrips, updatedTrips };
    } else {
      throw new Error('Failed to pull trips from cloud');
    }

  } catch (error) {
    console.error('❌ Force sync failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Repair sync status markers on all local trips
 */
async function repairSyncStatus() {
  console.log('🔧 Repairing sync status...');

  if (!authService.isAuthenticatedSync()) {
    console.error('❌ Not authenticated - please sign in first');
    return;
  }

  try {
    const token = await authService.getAccessToken();

    // Get cloud trips
    const getResponse = await fetch('/api/trips', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!getResponse.ok) {
      throw new Error('Failed to fetch cloud trips');
    }

    const cloudTrips = await getResponse.json();
    const cloudIds = new Set(cloudTrips.map(t => t.id));

    // Update local trip sync status
    const tripManager = new TripManager();
    const localTrips = tripManager.getAllTrips();
    let fixed = 0;

    for (const trip of localTrips) {
      const inCloud = cloudIds.has(trip.id);
      if (trip.cloudSynced !== inCloud) {
        tripManager.updateTrip(trip.id, {
          cloudSynced: inCloud,
          lastSyncAt: inCloud ? new Date().toISOString() : null
        });
        fixed++;
        console.log(`  ${inCloud ? '✅' : '❌'} ${trip.name}: ${trip.cloudSynced ? 'already synced' : 'now marked'} as ${inCloud ? 'synced' : 'not synced'}`);
      }
    }

    console.log(`✅ Repaired ${fixed} trips`);

    // Reload dashboard
    if (typeof loadTrips === 'function') {
      loadTrips();
    }

    return { success: true, fixed };

  } catch (error) {
    console.error('❌ Repair failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear all sync metadata and resync from scratch
 */
async function clearSyncAndResync() {
  console.log('🗑️ Clearing sync metadata and resyncing...');

  if (!confirm('This will clear all sync metadata and resync from cloud. Continue?')) {
    console.log('❌ Cancelled');
    return;
  }

  try {
    // Clear sync status on all trips
    const tripManager = new TripManager();
    const trips = tripManager.getAllTrips();

    for (const trip of trips) {
      tripManager.updateTrip(trip.id, {
        cloudSynced: false,
        lastSyncAt: null
      });
    }

    // Clear sync service state
    syncService.lastSyncTime = null;

    // Clear migration flag (per user)
    const user = authService.getCurrentUser();
    if (user) {
      const migrationKey = `wahgola_migration_done_${user.id}`;
      localStorage.removeItem(migrationKey);
    }

    console.log('✅ Cleared sync metadata');

    // Force resync
    console.log('🔄 Starting fresh sync...');
    await forceSyncAll();

  } catch (error) {
    console.error('❌ Clear and resync failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test sync with detailed logging
 */
async function testSync() {
  console.log('🧪 Testing sync with detailed logging...');

  // Run diagnostic first
  if (typeof diagnoseSyncIssues !== 'undefined') {
    await diagnoseSyncIssues();
  }

  // Try a sync
  try {
    console.log('\n🔄 Attempting syncAll()...');
    await syncService.syncAll();
    console.log('✅ Sync completed successfully');
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }

  // Check status after
  const status = syncService.getSyncStatus();
  console.log('\n📊 Final Status:');
  console.log(status);
}

console.log('Sync Fix Utility loaded!');
console.log('Available commands:');
console.log('  - await forceSyncAll()        : Force sync all trips');
console.log('  - await repairSyncStatus()    : Fix sync status markers');
console.log('  - await clearSyncAndResync()  : Clear and resync everything');
console.log('  - await testSync()            : Run diagnostic + sync');
