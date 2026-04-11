/**
 * Sync Diagnostic Tool
 * Run this in browser console to diagnose sync issues
 *
 * Usage:
 * 1. Open browser console on dashboard
 * 2. Copy and paste this entire file
 * 3. Run: await diagnoseSyncIssues()
 */

async function diagnoseSyncIssues() {
  console.log('🔍 Sync Diagnostic Tool');
  console.log('='.repeat(50));

  const results = {
    auth: {},
    localStorage: {},
    cloudAPI: {},
    syncService: {},
    recommendations: []
  };

  // 1. Check Authentication
  console.log('\n1️⃣ Checking Authentication...');
  try {
    if (typeof authService === 'undefined') {
      results.auth.error = 'authService not available';
      results.recommendations.push('❌ Auth service not loaded - check if auth-service.js is included');
    } else {
      const user = authService.getCurrentUser();
      const isAuth = authService.isAuthenticatedSync();
      results.auth.authenticated = isAuth;
      results.auth.user = user ? { id: user.id, email: user.email } : null;

      if (!isAuth) {
        results.recommendations.push('❌ User not authenticated - sign in first');
      } else {
        console.log('✅ User authenticated:', user.email);

        // Try to get token
        try {
          const token = await authService.getAccessToken();
          results.auth.hasToken = !!token;
          results.auth.tokenLength = token ? token.length : 0;
          console.log('✅ Access token available:', token ? `${token.substring(0, 20)}...` : 'null');
        } catch (error) {
          results.auth.tokenError = error.message;
          results.recommendations.push('❌ Cannot get access token: ' + error.message);
        }
      }
    }
  } catch (error) {
    results.auth.error = error.message;
    results.recommendations.push('❌ Auth check failed: ' + error.message);
  }

  // 2. Check localStorage
  console.log('\n2️⃣ Checking localStorage...');
  try {
    const tripManager = new TripManager();
    const localTrips = tripManager.getAllTrips();
    results.localStorage.tripCount = localTrips.length;
    results.localStorage.trips = localTrips.map(t => ({
      id: t.id,
      name: t.name,
      cloudSynced: t.cloudSynced,
      lastSyncAt: t.lastSyncAt,
      updatedAt: t.updatedAt
    }));

    const syncedCount = localTrips.filter(t => t.cloudSynced).length;
    console.log(`📦 Local trips: ${localTrips.length} (${syncedCount} marked as synced)`);

    if (localTrips.length === 0) {
      results.recommendations.push('ℹ️ No local trips found');
    }

    localTrips.forEach(trip => {
      console.log(`  - ${trip.name} | Synced: ${trip.cloudSynced ? '✅' : '❌'} | Last sync: ${trip.lastSyncAt || 'never'}`);
    });
  } catch (error) {
    results.localStorage.error = error.message;
    results.recommendations.push('❌ localStorage check failed: ' + error.message);
  }

  // 3. Check Cloud API
  console.log('\n3️⃣ Checking Cloud API...');
  if (results.auth.authenticated && results.auth.hasToken) {
    try {
      const token = await authService.getAccessToken();

      // Test GET /api/trips
      console.log('Testing GET /api/trips...');
      const getResponse = await fetch('/api/trips', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      results.cloudAPI.getStatus = getResponse.status;
      results.cloudAPI.getOk = getResponse.ok;

      if (getResponse.ok) {
        const cloudTrips = await getResponse.json();
        results.cloudAPI.cloudTripCount = cloudTrips.length;
        results.cloudAPI.cloudTrips = cloudTrips.map(t => ({
          id: t.id,
          name: t.name || t.data?.name,
          updated_at: t.updated_at
        }));
        console.log(`✅ Cloud API accessible - ${cloudTrips.length} trips in cloud`);

        cloudTrips.forEach(trip => {
          console.log(`  - ${trip.name || trip.data?.name} | Updated: ${trip.updated_at}`);
        });
      } else {
        const errorText = await getResponse.text();
        results.cloudAPI.getError = errorText;
        results.recommendations.push(`❌ Cloud API GET failed (${getResponse.status}): ${errorText}`);
      }

      // Test POST /api/trips (with a dummy trip)
      console.log('Testing POST /api/trips...');
      const testTrip = {
        tripId: 'test_' + Date.now(),
        name: 'Sync Test Trip (DELETE ME)',
        destination: 'Test',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        coverImage: '',
        data: { days: [] },
        deviceId: localStorage.getItem('wahgola_device_id') || 'test_device'
      };

      const postResponse = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testTrip)
      });

      results.cloudAPI.postStatus = postResponse.status;
      results.cloudAPI.postOk = postResponse.ok;

      if (postResponse.ok) {
        console.log('✅ Cloud API POST works');
      } else {
        const errorText = await postResponse.text();
        results.cloudAPI.postError = errorText;
        results.recommendations.push(`❌ Cloud API POST failed (${postResponse.status}): ${errorText}`);
      }

    } catch (error) {
      results.cloudAPI.error = error.message;
      results.recommendations.push('❌ Cloud API check failed: ' + error.message);
    }
  } else {
    results.recommendations.push('⏭️ Skipped cloud API check (not authenticated)');
  }

  // 4. Check Sync Service
  console.log('\n4️⃣ Checking Sync Service...');
  try {
    if (typeof syncService === 'undefined') {
      results.syncService.error = 'syncService not available';
      results.recommendations.push('❌ Sync service not loaded - check if sync-service.js is included');
    } else {
      const syncStatus = syncService.getSyncStatus();
      results.syncService.status = syncStatus;
      results.syncService.deviceId = syncStatus.deviceId;
      results.syncService.lastSync = syncStatus.lastSync;
      results.syncService.syncing = syncStatus.syncing;

      console.log('📊 Sync Status:');
      console.log(`  Device ID: ${syncStatus.deviceId}`);
      console.log(`  Last Sync: ${syncStatus.lastSync || 'never'}`);
      console.log(`  Syncing: ${syncStatus.syncing ? 'Yes' : 'No'}`);
      console.log(`  Authenticated: ${syncStatus.authenticated ? 'Yes' : 'No'}`);

      if (!syncStatus.lastSync) {
        results.recommendations.push('ℹ️ Never synced - try running manual sync');
      }
    }
  } catch (error) {
    results.syncService.error = error.message;
    results.recommendations.push('❌ Sync service check failed: ' + error.message);
  }

  // 5. Compare local vs cloud
  console.log('\n5️⃣ Comparing Local vs Cloud...');
  if (results.localStorage.trips && results.cloudAPI.cloudTrips) {
    const localIds = new Set(results.localStorage.trips.map(t => t.id));
    const cloudIds = new Set(results.cloudAPI.cloudTrips.map(t => t.id));

    const onlyLocal = results.localStorage.trips.filter(t => !cloudIds.has(t.id));
    const onlyCloud = results.cloudAPI.cloudTrips.filter(t => !localIds.has(t.id));
    const inBoth = results.localStorage.trips.filter(t => cloudIds.has(t.id));

    results.comparison = {
      onlyLocal: onlyLocal.length,
      onlyCloud: onlyCloud.length,
      inBoth: inBoth.length
    };

    console.log(`📊 Comparison:`);
    console.log(`  Only in local: ${onlyLocal.length}`);
    console.log(`  Only in cloud: ${onlyCloud.length}`);
    console.log(`  In both: ${inBoth.length}`);

    if (onlyLocal.length > 0) {
      console.log('  Local-only trips:', onlyLocal.map(t => t.name));
      results.recommendations.push(`ℹ️ ${onlyLocal.length} trips only in local - need to push`);
    }

    if (onlyCloud.length > 0) {
      console.log('  Cloud-only trips:', onlyCloud.map(t => t.name));
      results.recommendations.push(`ℹ️ ${onlyCloud.length} trips only in cloud - need to pull`);
    }
  }

  // 6. Final recommendations
  console.log('\n📋 Recommendations:');
  if (results.recommendations.length === 0) {
    console.log('✅ Everything looks good!');
    results.recommendations.push('✅ No issues found - sync should work');
  } else {
    results.recommendations.forEach(rec => console.log(rec));
  }

  console.log('\n' + '='.repeat(50));
  console.log('Full diagnostic results saved to window.syncDiagnostics');
  window.syncDiagnostics = results;

  return results;
}

// Run diagnostic immediately if in browser
if (typeof window !== 'undefined') {
  console.log('Sync Diagnostic Tool loaded. Run: await diagnoseSyncIssues()');
}
