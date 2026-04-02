/**
 * Debug Trip Issues
 * Copy and paste this into browser console on wahgola.zavecoder.com
 */

async function debugTrip() {
  console.log('🔍 Starting trip diagnostic...\n');

  // 1. Check localStorage
  console.log('📦 Checking localStorage...');
  const trips = localStorage.getItem('trips');
  if (!trips) {
    console.error('❌ No trips found in localStorage');
    return;
  }

  const parsedTrips = JSON.parse(trips);
  console.log(`✅ Found ${Object.keys(parsedTrips).length} trips in localStorage`);

  // 2. Check specific trip
  const tripId = '1775105118518-6tzcnlu6d';
  const trip = parsedTrips[tripId];

  if (!trip) {
    console.error(`❌ Trip ${tripId} not found`);
    console.log('Available trip IDs:', Object.keys(parsedTrips));
    return;
  }

  console.log('\n✅ Trip found:', trip.name);
  console.log('📅 Dates:', trip.startDate, 'to', trip.endDate);
  console.log('📍 Destination:', trip.destination);
  console.log('🗓️ Number of days:', trip.days?.length || 0);

  // 3. Check each day
  console.log('\n📊 Day-by-day analysis:');
  if (trip.days && Array.isArray(trip.days)) {
    trip.days.forEach((day, index) => {
      const activitiesCount = day.activities?.length || 0;
      const hasTitle = !!day.title;
      const hasActivities = activitiesCount > 0;

      console.log(`\nDay ${index + 1}:`);
      console.log(`  Title: ${hasTitle ? '✅' : '❌'} "${day.title || 'MISSING'}"`);
      console.log(`  Activities: ${hasActivities ? '✅' : '❌'} ${activitiesCount} activities`);

      if (hasActivities) {
        day.activities.forEach((activity, actIndex) => {
          const hasLocation = !!activity.location;
          const hasCoords = activity.location?.lat && activity.location?.lng;
          console.log(`    ${actIndex + 1}. ${activity.name || activity.title || 'UNNAMED'}`);
          console.log(`       Location: ${hasLocation ? (hasCoords ? '✅' : '⚠️ No coords') : '❌'}`);
        });
      }
    });
  } else {
    console.error('❌ Days is not an array or missing');
  }

  // 4. Check for common issues
  console.log('\n🔬 Checking for common issues:');

  const issues = [];

  if (!trip.days || trip.days.length === 0) {
    issues.push('No days in trip');
  }

  if (trip.days) {
    trip.days.forEach((day, i) => {
      if (!day.title) {
        issues.push(`Day ${i + 1} has no title`);
      }
      if (!day.activities || day.activities.length === 0) {
        issues.push(`Day ${i + 1} has no activities`);
      }
      day.activities?.forEach((activity, j) => {
        if (!activity.location) {
          issues.push(`Day ${i + 1}, Activity ${j + 1} has no location`);
        } else if (!activity.location.lat || !activity.location.lng) {
          issues.push(`Day ${i + 1}, Activity ${j + 1} has invalid coordinates`);
        }
      });
    });
  }

  if (issues.length === 0) {
    console.log('✅ No issues found! Trip data looks good.');
  } else {
    console.log('⚠️ Issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }

  // 5. Test if trip can be viewed
  console.log('\n🌐 Testing trip URL...');
  const url = `https://wahgola.zavecoder.com/trip-planner-v2?trip=${tripId}`;
  console.log(`URL: ${url}`);

  // 6. Check raw JSON structure
  console.log('\n📋 Raw trip JSON (first 500 chars):');
  console.log(JSON.stringify(trip, null, 2).substring(0, 500) + '...');

  console.log('\n✅ Diagnostic complete!');
  return {
    trip,
    issues,
    dayCount: trip.days?.length || 0,
    totalActivities: trip.days?.reduce((sum, day) => sum + (day.activities?.length || 0), 0) || 0
  };
}

// Run diagnostic
debugTrip().then(result => {
  if (result) {
    console.log('\n📊 Summary:', {
      days: result.dayCount,
      activities: result.totalActivities,
      issues: result.issues.length
    });
  }
});
