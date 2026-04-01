/**
 * E2E Test: AI Trip Generation Flow
 * Tests the complete flow from dashboard to trip creation to viewing
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://wahgola.zavecoder.com';

test.describe('AI Trip Generation Flow', () => {
  test('should create and view an AI-generated trip', async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser Error:', msg.text());
      } else if (msg.text().includes('[AI Generation]')) {
        console.log('AI Gen:', msg.text());
      }
    });

    // Track network errors
    page.on('requestfailed', request => {
      console.error('Network Failed:', request.url(), request.failure().errorText);
    });

    // Step 1: Navigate to dashboard
    console.log('📍 Step 1: Navigate to dashboard');
    await page.goto(`${BASE_URL}/dashboard.html`);
    await page.waitForLoadState('networkidle');

    // Verify dashboard loaded
    await expect(page.locator('.logo-text')).toBeVisible();
    console.log('✅ Dashboard loaded');

    // Step 2: Click "New Trip" button
    console.log('📍 Step 2: Click New Trip button');
    await page.click('#newTripBtn');
    await page.waitForSelector('.modal-method', { state: 'visible' });
    console.log('✅ Method modal opened');

    // Step 3: Select "Generate with AI"
    console.log('📍 Step 3: Select Generate with AI');
    await page.click('.method-featured');
    await page.waitForSelector('.modal-ai', { state: 'visible' });
    console.log('✅ AI modal opened');

    // Step 4: Enter trip prompt
    console.log('📍 Step 4: Enter trip prompt');
    const prompt = '5-day cultural trip to Kuala Lumpur, Malaysia with temples, food, and shopping';
    await page.fill('#aiPrompt', prompt);
    await page.waitForTimeout(500);

    // Verify prompt was entered
    const enteredPrompt = await page.inputValue('#aiPrompt');
    expect(enteredPrompt).toBe(prompt);
    console.log('✅ Prompt entered:', prompt);

    // Step 5: Click "Generate Trip" button
    console.log('📍 Step 5: Click Generate Trip button');

    // Intercept the API call
    const apiPromise = page.waitForResponse(
      response => response.url().includes('/api/generate-trip') && response.status() === 200,
      { timeout: 60000 }
    );

    await page.click('#generateBtn');

    // Wait for loading state
    await page.waitForSelector('#loadingState', { state: 'visible' });
    console.log('✅ Loading state visible');

    // Wait for API response
    console.log('⏳ Waiting for AI to generate trip (up to 60s)...');
    const apiResponse = await apiPromise;
    const tripData = await apiResponse.json();

    console.log('✅ Trip generated:', {
      name: tripData.name,
      destination: tripData.destination,
      days: tripData.days?.length,
      coverImage: tripData.coverImage
    });

    // Verify trip data structure
    expect(tripData).toHaveProperty('name');
    expect(tripData).toHaveProperty('destination');
    expect(tripData).toHaveProperty('days');
    expect(tripData.days).toBeInstanceOf(Array);
    expect(tripData.days.length).toBeGreaterThan(0);

    // Check if cover image is present
    if (!tripData.coverImage || tripData.coverImage === '') {
      console.warn('⚠️  Cover image missing from API response');
    } else {
      console.log('✅ Cover image:', tripData.coverImage);
    }

    // Step 6: Wait for redirect to trip planner
    console.log('📍 Step 6: Wait for redirect to trip planner');
    await page.waitForURL(/trip-planner\.html\?trip=/, { timeout: 10000 });
    console.log('✅ Redirected to trip planner');

    const currentURL = page.url();
    const tripId = new URL(currentURL).searchParams.get('trip');
    console.log('✅ Trip ID:', tripId);

    // Step 7: Verify trip loaded in trip planner
    console.log('📍 Step 7: Verify trip loaded');

    // Wait for trip to load (check for trip title or error)
    await page.waitForSelector('.trip-title-text, .error-message', { timeout: 10000 });

    // Check if there's an error
    const errorMessage = await page.locator('.error-message').count();
    if (errorMessage > 0) {
      const errorText = await page.locator('.error-message').textContent();
      console.error('❌ Error loading trip:', errorText);

      // Get all localStorage data for debugging
      const localStorage = await page.evaluate(() => {
        return JSON.stringify(window.localStorage, null, 2);
      });
      console.log('LocalStorage:', localStorage);

      throw new Error(`Trip failed to load: ${errorText}`);
    }

    // Verify trip title is visible
    const tripTitle = await page.locator('.trip-title-text').textContent();
    console.log('✅ Trip loaded:', tripTitle);

    // Verify trip has days
    const dayCards = await page.locator('.day-card').count();
    console.log('✅ Trip has', dayCards, 'days');
    expect(dayCards).toBeGreaterThan(0);

    // Step 8: Check localStorage
    console.log('📍 Step 8: Verify localStorage');
    const localStorageData = await page.evaluate(() => {
      const data = localStorage.getItem('wahgola_trips');
      return data ? JSON.parse(data) : null;
    });

    console.log('LocalStorage trips:', localStorageData?.trips?.length || 0);

    if (localStorageData && localStorageData.trips) {
      const savedTrip = localStorageData.trips.find(t => t.id === tripId);
      if (savedTrip) {
        console.log('✅ Trip found in localStorage:', {
          id: savedTrip.id,
          name: savedTrip.name,
          destination: savedTrip.destination
        });
      } else {
        console.warn('⚠️  Trip NOT found in localStorage, may have loaded from cloud');
      }
    }

    // Step 9: Verify map loaded
    console.log('📍 Step 9: Verify map');
    const mapCanvas = await page.locator('.mapboxgl-canvas').count();
    if (mapCanvas > 0) {
      console.log('✅ Map loaded');
    } else {
      console.warn('⚠️  Map not found');
    }

    console.log('\n🎉 All tests passed!');
  });

  test('should show proper error for missing trip', async ({ page }) => {
    console.log('📍 Test: Missing trip error handling');

    await page.goto(`${BASE_URL}/trip-planner.html?trip=nonexistent-trip-id`);
    await page.waitForLoadState('networkidle');

    // Should either show error or redirect to dashboard
    const isOnDashboard = page.url().includes('dashboard.html');
    const hasAlert = await page.locator('.error-message').count() > 0;

    expect(isOnDashboard || hasAlert).toBeTruthy();
    console.log('✅ Properly handled missing trip');
  });
});
