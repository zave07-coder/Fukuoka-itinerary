/**
 * POI Image Service
 * Fetches and caches POI images with waterfall approach
 */

class POIImageService {
  constructor() {
    this.cache = new Map(); // In-memory cache for this session
  }

  /**
   * Get POI image with caching
   * @param {string} poiName - Name of the POI
   * @param {object} location - Location object with lat/lng
   * @param {string} category - POI category (restaurant, temple, etc.)
   * @returns {Promise<{imageUrl: string, source: string, attribution: string}>}
   */
  async getImage(poiName, location = null, category = null) {
    if (!poiName) {
      return this.getPlaceholder(category);
    }

    const cacheKey = this.getCacheKey(poiName, location);

    // Check in-memory cache first
    if (this.cache.has(cacheKey)) {
      console.log(`💨 Memory cache hit for "${poiName}"`);
      return this.cache.get(cacheKey);
    }

    try {
      // Fetch from backend (which checks Supabase cache and external APIs)
      const response = await fetch('/api/poi-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          poiName,
          location,
          category
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Cache in memory
      this.cache.set(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Failed to fetch POI image:', error);
      return this.getPlaceholder(category);
    }
  }

  /**
   * Batch fetch multiple POI images
   * @param {Array<{poiName, location, category}>} pois
   * @returns {Promise<Array>}
   */
  async getBatch(pois) {
    const promises = pois.map(poi =>
      this.getImage(poi.poiName, poi.location, poi.category)
    );

    return Promise.all(promises);
  }

  /**
   * Get placeholder image based on category
   */
  getPlaceholder(category) {
    const placeholders = {
      'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      'cafe': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
      'temple': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80',
      'shrine': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80',
      'attraction': 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800&q=80',
      'hotel': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
      'shopping': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
      'park': 'https://images.unsplash.com/photo-1520302630591-dca90fcaa36a?w=800&q=80',
      'museum': 'https://images.unsplash.com/photo-1565516781744-61b5df634672?w=800&q=80',
      'default': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80'
    };

    const imageUrl = placeholders[category?.toLowerCase()] || placeholders.default;

    return {
      imageUrl,
      source: 'placeholder',
      attribution: null
    };
  }

  /**
   * Generate cache key
   */
  getCacheKey(poiName, location) {
    const normalizedName = (poiName || '').toLowerCase().trim();
    const latLng = location ? `${location.lat},${location.lng}` : '';
    return `${normalizedName}-${latLng}`;
  }

  /**
   * Clear in-memory cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
window.poiImageService = new POIImageService();
