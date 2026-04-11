// Check latest sync status from Supabase
const SUPABASE_URL = 'https://gdhyukplodnvokrmxvba.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.ZTESTER_SUPABASE_SERVICE_KEY;

async function checkSync() {
  try {
    // Get latest sync metadata
    const response = await fetch(`${SUPABASE_URL}/rest/v1/sync_metadata?order=last_sync_at.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const syncRecords = await response.json();
    
    console.log('\n📊 Latest Sync Records:\n');
    console.log('='.repeat(80));
    
    if (syncRecords.length === 0) {
      console.log('No sync records found.');
      return;
    }

    syncRecords.forEach((record, idx) => {
      console.log(`\n${idx + 1}. Sync Record:`);
      console.log(`   User ID: ${record.user_id}`);
      console.log(`   Device ID: ${record.device_id}`);
      console.log(`   Last Sync: ${new Date(record.last_sync_at).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SGT`);
      console.log(`   Status: ${record.sync_status || 'N/A'}`);
      console.log(`   Trip Count: ${record.trip_count || 0}`);
      console.log(`   Data Size: ${record.data_size_bytes ? (record.data_size_bytes / 1024).toFixed(2) + ' KB' : 'N/A'}`);
      console.log(`   Created: ${new Date(record.created_at).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SGT`);
      console.log(`   Updated: ${new Date(record.updated_at).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SGT`);
    });

    console.log('\n' + '='.repeat(80));

    // Get latest trips
    console.log('\n📋 Latest Trips:\n');
    console.log('='.repeat(80));

    const tripsResponse = await fetch(`${SUPABASE_URL}/rest/v1/trips?order=updated_at.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!tripsResponse.ok) {
      throw new Error(`HTTP ${tripsResponse.status}: ${await tripsResponse.text()}`);
    }

    const trips = await tripsResponse.json();
    
    if (trips.length === 0) {
      console.log('No trips found.');
      return;
    }

    trips.forEach((trip, idx) => {
      const data = typeof trip.data === 'string' ? JSON.parse(trip.data) : trip.data;
      console.log(`\n${idx + 1}. Trip:`);
      console.log(`   ID: ${trip.id}`);
      console.log(`   Name: ${data.name || 'Untitled'}`);
      console.log(`   Destination: ${data.destination || 'N/A'}`);
      console.log(`   Days: ${data.days?.length || 0}`);
      console.log(`   User ID: ${trip.user_id}`);
      console.log(`   Created: ${new Date(trip.created_at).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SGT`);
      console.log(`   Updated: ${new Date(trip.updated_at).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SGT`);
    });

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error checking sync:', error.message);
  }
}

checkSync();
