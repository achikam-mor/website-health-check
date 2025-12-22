import { test, expect, Page } from '@playwright/test';

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// List of realistic user agents to rotate through
const userAgents = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  // Chrome on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  // Firefox on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  // Firefox on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  // Safari on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  // Edge on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  // Chrome on Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

// Get a random user agent
function getRandomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// List of geolocations (USA, Canada, Western Europe)
const geolocations = [
  // USA
  { latitude: 40.7128, longitude: -74.0060, name: 'New York, USA' },
  { latitude: 34.0522, longitude: -118.2437, name: 'Los Angeles, USA' },
  { latitude: 41.8781, longitude: -87.6298, name: 'Chicago, USA' },
  { latitude: 37.7749, longitude: -122.4194, name: 'San Francisco, USA' },
  { latitude: 47.6062, longitude: -122.3321, name: 'Seattle, USA' },
  // Canada
  { latitude: 43.6532, longitude: -79.3832, name: 'Toronto, Canada' },
  { latitude: 45.5017, longitude: -73.5673, name: 'Montreal, Canada' },
  { latitude: 49.2827, longitude: -123.1207, name: 'Vancouver, Canada' },
  { latitude: 51.0447, longitude: -114.0719, name: 'Calgary, Canada' },
  // Western Europe
  { latitude: 51.5074, longitude: -0.1278, name: 'London, UK' },
  { latitude: 48.8566, longitude: 2.3522, name: 'Paris, France' },
  { latitude: 52.5200, longitude: 13.4050, name: 'Berlin, Germany' },
  { latitude: 52.3676, longitude: 4.9041, name: 'Amsterdam, Netherlands' },
  { latitude: 50.8503, longitude: 4.3517, name: 'Brussels, Belgium' },
  { latitude: 41.3851, longitude: 2.1734, name: 'Barcelona, Spain' },
];

// Get a random geolocation
function getRandomGeolocation(): { latitude: number; longitude: number; name: string } {
  return geolocations[Math.floor(Math.random() * geolocations.length)];
}

// Function to simulate human-like scrolling
async function humanScroll(page: Page) {
  // 1. Scroll Down
  let currentScroll = 0;
  let scrollHeight = await page.evaluate(() => document.body.scrollHeight);

  while (currentScroll < scrollHeight) {
    // Scroll a random small amount (between 300px and 500px)
    const step = Math.floor(Math.random() * 200) + 300;
    currentScroll += step;
    
    await page.evaluate((y) => window.scrollTo(0, y), currentScroll);
    
    // Recalculate height in case lazy-loading expanded the page
    scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    
    // Wait for a "reading" pause (between 200ms and 1100ms)
    const pause = Math.floor(Math.random() * 800) + 300;
    await page.waitForTimeout(pause);
  }

  // 2. Short pause at the bottom
  await page.waitForTimeout(1000);

  // 3. Scroll Back Up
  while (currentScroll > 0) {
    const step = Math.floor(Math.random() * 200) + 300;
    currentScroll -= step;
    if (currentScroll < 0) currentScroll = 0;

    await page.evaluate((y) => window.scrollTo(0, y), currentScroll);
    await page.waitForTimeout(313); // Faster scrolling up
  }
}

// Base pages (excluding homepage)
const innerPages = [
  'https://www.stockscanner.net/market-overview.html',
  'https://www.stockscanner.net/hot-stocks.html',
  'https://www.stockscanner.net/watch-list.html',
  'https://www.stockscanner.net/favorites.html',
  'https://www.stockscanner.net/filtered-stocks.html',
  'https://www.stockscanner.net/chart-viewer.html',
  'https://www.stockscanner.net/compare.html',
  'https://www.stockscanner.net/export.html'
];

interface PageFailure {
  url: string;
  error: string;
}

test.describe('StockScanner Health Check', () => {
  test('Visit and scroll all pages', async ({ page, context }) => {
    // Build final page list: homepage first, shuffled inner pages, homepage last
    const pagesToTest = [
      'https://www.stockscanner.net',
      ...shuffleArray(innerPages),
      'https://www.stockscanner.net'
    ];

    const failures: PageFailure[] = [];
    
    // Increased timeout to 20 mins to account for all pages with slow scrolling
    test.setTimeout(1200000);

    // Select a single random user agent for this entire execution
    const userAgent = getRandomUserAgent();
    await page.setExtraHTTPHeaders({ 'User-Agent': userAgent });

    // Set random geolocation for this execution
    const geo = getRandomGeolocation();
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: geo.latitude, longitude: geo.longitude });

    console.log(`\n🌐 User-Agent: ${userAgent}`);
    console.log(`📍 Geolocation: ${geo.name} (${geo.latitude}, ${geo.longitude})\n`);

    for (let i = 0; i < pagesToTest.length; i++) {
      const url = pagesToTest[i];
      
      await test.step(`[${i + 1}] Visit and scroll: ${url}`, async () => {
        console.log(`Navigating to ${url}...`);

        try {
          await page.goto(url, { waitUntil: 'domcontentloaded' });
          
          // Verify basic element exists to confirm page load
          await expect(page.locator('body')).toBeVisible();

          // Perform the scrolling
          await humanScroll(page);
          
          console.log(`✅ Successfully checked: ${url}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ Failed to check: ${url} - ${errorMessage}`);
          failures.push({ url, error: errorMessage });
        }
      });
    }

    // Final report
    if (failures.length > 0) {
      console.error('\n========== HEALTH CHECK FAILED ==========');
      console.error(`${failures.length} page(s) failed:\n`);
      
      for (const failure of failures) {
        console.error(`  ❌ ${failure.url}`);
        console.error(`     Reason: ${failure.error}\n`);
      }
      
      console.error('==========================================\n');
      
      // Throw error to mark the overall action as failed
      throw new Error(`Health check failed for ${failures.length} page(s): ${failures.map(f => f.url).join(', ')}`);
    } else {
      console.log('\n========== HEALTH CHECK PASSED ==========');
      console.log('All pages checked successfully!');
      console.log('==========================================\n');
    }
  });
});