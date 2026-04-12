/**
 * Image Optimizer
 * Handles lazy loading, responsive images, and optimization
 */

class ImageOptimizer {
  constructor() {
    this.observer = null;
    this.initLazyLoading();
  }

  /**
   * Initialize Intersection Observer for lazy loading
   */
  initLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.loadImage(entry.target);
              this.observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px', // Start loading 50px before image enters viewport
          threshold: 0.01
        }
      );
    }
  }

  /**
   * Load an image (used by lazy loading)
   */
  loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;

    if (srcset) {
      img.srcset = srcset;
    }

    if (src) {
      img.src = src;
    }

    img.classList.add('loaded');

    // Remove loading placeholder
    img.removeAttribute('data-src');
    img.removeAttribute('data-srcset');
  }

  /**
   * Create optimized img element with lazy loading
   * @param {string} imageUrl - Image URL
   * @param {string} alt - Alt text
   * @param {object} options - Additional options
   * @returns {HTMLImageElement}
   */
  createImage(imageUrl, alt = '', options = {}) {
    const img = document.createElement('img');
    const responsive = window.poiImageService?.getResponsiveImage(imageUrl);

    // Set alt text
    img.alt = alt;

    // Add lazy loading attributes
    img.loading = 'lazy';
    img.decoding = 'async';

    // Set responsive images if available
    if (responsive) {
      if (this.observer) {
        // Use Intersection Observer for lazy loading
        img.dataset.src = responsive.src;
        if (responsive.srcset) {
          img.dataset.srcset = responsive.srcset;
        }
        if (responsive.sizes) {
          img.sizes = responsive.sizes;
        }

        // Set low-quality placeholder
        const placeholder = this.getLowQualityPlaceholder(responsive.src);
        img.src = placeholder;

        // Add blur class for smooth transition
        img.classList.add('lazy', 'loading');

        // Observe for lazy loading
        this.observer.observe(img);
      } else {
        // Fallback: use native lazy loading
        img.src = responsive.src;
        if (responsive.srcset) {
          img.srcset = responsive.srcset;
        }
        if (responsive.sizes) {
          img.sizes = responsive.sizes;
        }
      }
    } else {
      img.src = imageUrl;
    }

    // Apply additional options
    if (options.className) {
      img.className = options.className;
    }

    if (options.style) {
      Object.assign(img.style, options.style);
    }

    return img;
  }

  /**
   * Generate low-quality placeholder URL
   * @param {string} imageUrl - Original image URL
   * @returns {string} - Tiny placeholder URL
   */
  getLowQualityPlaceholder(imageUrl) {
    if (imageUrl.includes('images.unsplash.com')) {
      const baseUrl = imageUrl.split('?')[0];
      return `${baseUrl}?w=20&q=30&auto=format&blur=10`;
    }

    // For non-Unsplash, use a tiny data URI
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
  }

  /**
   * Optimize all images in a container
   * @param {HTMLElement} container - Container element
   */
  optimizeImagesInContainer(container) {
    if (!container) return;

    const images = container.querySelectorAll('img:not([data-optimized])');

    images.forEach((img) => {
      // Skip if already optimized
      if (img.dataset.optimized) return;

      // Add lazy loading
      if (!img.loading) {
        img.loading = 'lazy';
      }

      if (!img.decoding) {
        img.decoding = 'async';
      }

      // Mark as optimized
      img.dataset.optimized = 'true';

      // If image has src, optimize it
      if (img.src && window.poiImageService) {
        const responsive = window.poiImageService.getResponsiveImage(img.src);

        if (responsive && responsive.srcset) {
          img.srcset = responsive.srcset;

          if (responsive.sizes) {
            img.sizes = responsive.sizes;
          }
        }
      }
    });
  }

  /**
   * Preload critical images
   * @param {Array<string>} imageUrls - Array of image URLs to preload
   */
  preloadImages(imageUrls) {
    if (!Array.isArray(imageUrls)) return;

    imageUrls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;

      // Add responsive preload if supported
      if (url.includes('images.unsplash.com')) {
        const optimized = window.poiImageService?.optimizeUnsplashUrl(url, 400);
        link.href = optimized;
        link.imageSrcset = window.poiImageService?.getResponsiveImage(url)?.srcset;
        link.imageSizes = '(max-width: 768px) 100vw, 800px';
      }

      document.head.appendChild(link);
    });
  }

  /**
   * Monitor image loading performance
   */
  monitorPerformance() {
    if (!window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.initiatorType === 'img') {
          console.log('[Image Performance]', {
            url: entry.name,
            loadTime: entry.duration.toFixed(2) + 'ms',
            size: entry.transferSize ? (entry.transferSize / 1024).toFixed(2) + 'KB' : 'cached'
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Get image loading stats
   */
  getStats() {
    if (!window.performance || !window.performance.getEntriesByType) {
      return null;
    }

    const images = window.performance.getEntriesByType('resource')
      .filter(entry => entry.initiatorType === 'img');

    const totalSize = images.reduce((sum, img) => sum + (img.transferSize || 0), 0);
    const totalTime = images.reduce((sum, img) => sum + img.duration, 0);

    return {
      count: images.length,
      totalSize: (totalSize / 1024).toFixed(2) + ' KB',
      avgTime: images.length > 0 ? (totalTime / images.length).toFixed(2) + 'ms' : '0ms',
      cached: images.filter(img => img.transferSize === 0).length
    };
  }
}

// Create singleton instance
window.imageOptimizer = new ImageOptimizer();

// Auto-optimize images on page load
document.addEventListener('DOMContentLoaded', () => {
  window.imageOptimizer.optimizeImagesInContainer(document.body);
});

// Monitor performance in dev mode
if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
  window.imageOptimizer.monitorPerformance();

  // Expose stats to console
  window.getImageStats = () => window.imageOptimizer.getStats();
}
