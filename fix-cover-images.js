/**
 * Utility to add cover images to existing trips
 * Run this in browser console: Run from dashboard
 */

function getCoverImageForDestination(destination) {
  if (!destination) {
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80';
  }

  const dest = destination.toLowerCase();

  const imageMap = {
    // Japan
    'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
    'kyoto': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
    'osaka': 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&q=80',
    'fukuoka': 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&q=80',
    'japan': 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&q=80',

    // Malaysia
    'malaysia': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80',
    'kuala lumpur': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80',
    'penang': 'https://images.unsplash.com/photo-1570547823781-4582c4cfd7e1?w=800&q=80',

    // Southeast Asia
    'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
    'bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
    'thailand': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
    'vietnam': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80',
    'hanoi': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80',

    // Default fallback
    'default': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80'
  };

  for (const [key, url] of Object.entries(imageMap)) {
    if (dest.includes(key)) {
      return url;
    }
  }

  return imageMap.default;
}

function fixCoverImages() {
  const manager = new TripManager();
  const trips = manager.getAllTrips();
  let updated = 0;

  trips.forEach(trip => {
    if (!trip.coverImage || trip.coverImage === '') {
      const newCoverImage = getCoverImageForDestination(trip.destination);
      manager.updateTrip(trip.id, { coverImage: newCoverImage });
      console.log(`✅ Updated ${trip.name}: ${newCoverImage}`);
      updated++;
    }
  });

  console.log(`\n🎉 Fixed ${updated} trips!`);
  console.log('Refreshing page...');
  window.location.reload();
}

// Manual utility - run fixCoverImages() in console to update existing trips
console.log('💡 Cover image fixer loaded. Run fixCoverImages() to update existing trips.');
