/**
 * Trip Templates - Pre-built itineraries for popular destinations
 */

const TRIP_TEMPLATES = [
  {
    id: 'kyoto-5day-cultural',
    name: '5-Day Kyoto Cultural Experience',
    destination: 'Kyoto, Japan',
    duration: 5,
    category: 'Cultural',
    tags: ['temples', 'gardens', 'tea ceremony', 'traditional'],
    coverImage: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80',
    description: 'Explore ancient temples, zen gardens, and traditional tea ceremonies in Japan\'s cultural heart',
    difficulty: 'easy',
    budget: 'medium',
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(5),
    days: [
      {
        title: 'Northern Temples & Golden Pavilion',
        activities: [
          {
            time: '9:00 AM',
            name: 'Kinkaku-ji (Golden Pavilion)',
            details: 'Arrive early to avoid crowds. The golden reflection in the pond is best photographed in morning light. Entry: ¥500. Allow 1 hour to explore the gardens.',
            duration: '1 hour',
            location: {
              name: 'Kinkaku-ji Temple',
              address: '1 Kinkakujicho, Kita Ward, Kyoto, 603-8361',
              lat: 35.0394,
              lng: 135.7292,
              type: 'temple'
            }
          },
          {
            time: '11:00 AM',
            name: 'Ryoan-ji Zen Rock Garden',
            details: 'Famous for its minimalist rock garden. Sit and meditate while viewing the 15 rocks. Entry: ¥500.',
            duration: '45 minutes',
            location: {
              name: 'Ryoan-ji Temple',
              address: '13 Ryoanji Goryonoshitamachi, Ukyo Ward, Kyoto, 616-8001',
              lat: 35.0345,
              lng: 135.7183,
              type: 'temple'
            }
          },
          {
            time: '1:00 PM',
            name: 'Lunch at Shoraian',
            details: 'Traditional tofu kaiseki cuisine in a serene bamboo forest setting. Reservations recommended. Budget: ¥3,000-5,000.',
            duration: '1.5 hours',
            location: {
              name: 'Shoraian',
              address: '8 Sagatenryuji Susukinobabacho, Ukyo Ward, Kyoto, 616-8385',
              lat: 35.0156,
              lng: 135.6733,
              type: 'restaurant'
            }
          }
        ]
      },
      {
        title: 'Southern Temples & Fushimi Inari',
        activities: [
          {
            time: '8:30 AM',
            name: 'Fushimi Inari Shrine',
            details: 'Famous for thousands of vermillion torii gates. Hike to the summit (2-3 hours) or explore the lower trails. Free entry.',
            duration: '2-3 hours',
            location: {
              name: 'Fushimi Inari Taisha',
              address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto, 612-0882',
              lat: 34.9671,
              lng: 135.7727,
              type: 'temple'
            }
          },
          {
            time: '12:00 PM',
            name: 'Lunch at Vermillion Cafe',
            details: 'Modern cafe near Fushimi Inari. Try the matcha parfait and teriyaki burger.',
            duration: '1 hour',
            location: {
              name: 'Vermillion Cafe',
              address: '35-3 Fukakusa Ichinotsubocho, Fushimi Ward, Kyoto, 612-0012',
              lat: 34.9698,
              lng: 135.7742,
              type: 'restaurant'
            }
          }
        ]
      }
    ]
  },

  {
    id: 'tokyo-7day-urban',
    name: '7-Day Tokyo Urban Adventure',
    destination: 'Tokyo, Japan',
    duration: 7,
    category: 'Urban',
    tags: ['city', 'food', 'shopping', 'nightlife', 'modern'],
    coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
    description: 'Experience the vibrant energy of Tokyo from Shibuya crossing to Tsukiji fish market',
    difficulty: 'easy',
    budget: 'high',
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(7),
    days: [
      {
        title: 'Shibuya & Harajuku Youth Culture',
        activities: [
          {
            time: '10:00 AM',
            name: 'Shibuya Crossing',
            details: 'World\'s busiest pedestrian crossing. Best viewed from Shibuya Sky or Starbucks 2nd floor.',
            duration: '30 minutes',
            location: {
              name: 'Shibuya Scramble Crossing',
              address: '2-chōme-1 Dogenzaka, Shibuya City, Tokyo 150-0043',
              lat: 35.6595,
              lng: 139.7004,
              type: 'attraction'
            }
          },
          {
            time: '11:00 AM',
            name: 'Takeshita Street Shopping',
            details: 'Colorful street filled with trendy boutiques, crepe stands, and quirky fashion.',
            duration: '2 hours',
            location: {
              name: 'Takeshita Street',
              address: '1 Jingumae, Shibuya City, Tokyo 150-0001',
              lat: 35.6702,
              lng: 139.7027,
              type: 'shopping'
            }
          }
        ]
      }
    ]
  },

  {
    id: 'osaka-3day-food',
    name: '3-Day Osaka Food Tour',
    destination: 'Osaka, Japan',
    duration: 3,
    category: 'Food',
    tags: ['food', 'street food', 'izakaya', 'budget-friendly'],
    coverImage: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&q=80',
    description: 'Eat your way through Osaka\'s famous street food scene and hidden izakayas',
    difficulty: 'easy',
    budget: 'budget',
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(3),
    days: [
      {
        title: 'Dotonbori Street Food Paradise',
        activities: [
          {
            time: '6:00 PM',
            name: 'Dotonbori Food Walk',
            details: 'Try takoyaki, okonomiyaki, kushikatsu, and more. Budget ¥3,000-5,000 for sampling.',
            duration: '3 hours',
            location: {
              name: 'Dotonbori',
              address: 'Dotonbori, Chuo Ward, Osaka, 542-0071',
              lat: 34.6688,
              lng: 135.5008,
              type: 'attraction'
            }
          }
        ]
      }
    ]
  },

  {
    id: 'hiroshima-2day-history',
    name: '2-Day Hiroshima Peace & Island Escape',
    destination: 'Hiroshima, Japan',
    duration: 2,
    category: 'Historical',
    tags: ['history', 'peace memorial', 'island', 'nature'],
    coverImage: 'https://images.unsplash.com/photo-1563492065892-399f15b8bcef?w=800&q=80',
    description: 'Visit the Peace Memorial and sacred Miyajima Island with its floating torii gate',
    difficulty: 'moderate',
    budget: 'medium',
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(2),
    days: [
      {
        title: 'Peace Memorial & Hiroshima City',
        activities: [
          {
            time: '9:00 AM',
            name: 'Hiroshima Peace Memorial Museum',
            details: 'Moving exhibits about the atomic bombing. Allow 2-3 hours. Entry: ¥200.',
            duration: '2-3 hours',
            location: {
              name: 'Hiroshima Peace Memorial Museum',
              address: '1-2 Nakajimacho, Naka Ward, Hiroshima, 730-0811',
              lat: 34.3955,
              lng: 132.4536,
              type: 'attraction'
            }
          }
        ]
      }
    ]
  }
];

/**
 * Get default start date (tomorrow)
 */
function getDefaultStartDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Get default end date based on duration
 */
function getDefaultEndDate(duration) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + duration);
  return endDate.toISOString().split('T')[0];
}

/**
 * Template Manager Class
 */
class TemplateManager {
  constructor() {
    this.templates = TRIP_TEMPLATES;
  }

  /**
   * Get all templates
   */
  getAllTemplates() {
    return this.templates;
  }

  /**
   * Get template by ID
   */
  getTemplate(id) {
    return this.templates.find(t => t.id === id);
  }

  /**
   * Filter templates
   */
  filterTemplates(filters = {}) {
    let filtered = [...this.templates];

    if (filters.destination) {
      filtered = filtered.filter(t =>
        t.destination.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }

    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    if (filters.duration) {
      filtered = filtered.filter(t => t.duration === parseInt(filters.duration));
    }

    if (filters.budget) {
      filtered = filtered.filter(t => t.budget === filters.budget);
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(t =>
        filters.tags.some(tag => t.tags.includes(tag))
      );
    }

    return filtered;
  }

  /**
   * Create trip from template
   */
  createTripFromTemplate(templateId) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Clone template and create new trip
    const trip = {
      ...template,
      id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      templateId: templateId
    };

    // Remove template-specific fields
    delete trip.difficulty;
    delete trip.category;
    delete trip.tags;
    delete trip.description;

    return trip;
  }

  /**
   * Get categories
   */
  getCategories() {
    return [...new Set(this.templates.map(t => t.category))];
  }

  /**
   * Get all tags
   */
  getAllTags() {
    const tags = new Set();
    this.templates.forEach(t => {
      t.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }
}

// Export singleton
const templateManager = new TemplateManager();
