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
    // Optimized Unsplash URLs with auto=format for WebP support
    const placeholders = {
      'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=70&auto=format&fit=crop',
      'cafe': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=70&auto=format&fit=crop',
      'temple': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=70&auto=format&fit=crop',
      'shrine': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=70&auto=format&fit=crop',
      'attraction': 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800&q=70&auto=format&fit=crop',
      'hotel': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=70&auto=format&fit=crop',
      'shopping': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=70&auto=format&fit=crop',
      'park': 'https://images.unsplash.com/photo-1520302630591-dca90fcaa36a?w=800&q=70&auto=format&fit=crop',
      'museum': 'https://images.unsplash.com/photo-1565516781744-61b5df634672?w=800&q=70&auto=format&fit=crop',
      'default': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=70&auto=format&fit=crop'
    };

    const imageUrl = placeholders[category?.toLowerCase()] || placeholders.default;

    return {
      imageUrl,
      source: 'placeholder',
      attribution: null
    };
  }

  /**
   * Generate responsive srcset for an image URL
   * @param {string} imageUrl - Base image URL
   * @returns {object} - Object with src, srcset, and sizes
   */
  getResponsiveImage(imageUrl) {
    if (!imageUrl) return null;

    // Check if it's an Unsplash URL
    const isUnsplash = imageUrl.includes('images.unsplash.com');

    if (isUnsplash) {
      // Extract base URL without params
      const baseUrl = imageUrl.split('?')[0];

      return {
        src: `${baseUrl}?w=800&q=70&auto=format&fit=crop`,
        srcset: [
          `${baseUrl}?w=400&q=70&auto=format&fit=crop 400w`,
          `${baseUrl}?w=800&q=70&auto=format&fit=crop 800w`,
          `${baseUrl}?w=1200&q=70&auto=format&fit=crop 1200w`
        ].join(', '),
        sizes: '(max-width: 768px) 100vw, 800px'
      };
    }

    // For non-Unsplash URLs, return as-is
    return {
      src: imageUrl,
      srcset: null,
      sizes: null
    };
  }

  /**
   * Generate optimized URL for Unsplash images
   * @param {string} imageUrl - Original Unsplash URL
   * @param {number} width - Target width
   * @returns {string} - Optimized URL
   */
  optimizeUnsplashUrl(imageUrl, width = 800) {
    if (!imageUrl || !imageUrl.includes('images.unsplash.com')) {
      return imageUrl;
    }

    const baseUrl = imageUrl.split('?')[0];
    return `${baseUrl}?w=${width}&q=70&auto=format&fit=crop`;
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
