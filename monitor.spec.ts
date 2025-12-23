import { test, expect, Page } from '@playwright/test';
import { fetchAllProxies, getRegionalProxies } from './src/proxy-providers';
import { validateProxies, selectDiverseProxies, ValidatedProxy } from './src/proxy-validator';
import { launchBrowserWithProxy, getLocationName } from './src/browser-factory';

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
  location?: string;
}

interface LocationTestResult {
  location: string;
  proxy?: ValidatedProxy;
  success: boolean;
  failures: PageFailure[];
  timestamp: Date;
}

test.describe('StockScanner Multi-Location Health Check', () => {
  let workingProxies: ValidatedProxy[] = [];
  
  // Fetch and validate proxies before all tests
  test.beforeAll(async () => {
    // Increase timeout for proxy fetching and validation
    test.setTimeout(300000); // 5 minutes for beforeAll
    
    console.log('\n🌍 ========== MULTI-LOCATION PROXY SETUP ==========');
    
    try {
      // Fetch proxies from all sources
      const allProxies = await fetchAllProxies();
      
      if (allProxies.length === 0) {
        console.log('⚠️  No proxies fetched. Will run tests without proxy (default location only).');
        return;
      }
      
      // Filter to get regional diversity (reduced to 15 for faster validation)
      const regionalProxies = getRegionalProxies(allProxies, 3); // 3 proxies per priority region
      const proxiesToValidate = regionalProxies.slice(0, 15); // Max 15 proxies
      console.log(`📍 Selected ${proxiesToValidate.length} regional proxies for validation`);
      
      // Validate proxies (concurrency: 10, timeout: 8s per proxy for faster validation)
      const validatedProxies = await validateProxies(proxiesToValidate, 10, 8000);
      
      // Select diverse working proxies from different regions (max 3-5)
      workingProxies = selectDiverseProxies(validatedProxies, 3);
      
      if (workingProxies.length === 0) {
        console.log('⚠️  No working proxies found. Will run tests without proxy (default location only).');
      } else {
        console.log(`\n✅ Found ${workingProxies.length} working proxies:`);
        for (const proxy of workingProxies) {
          console.log(`   • ${proxy.country}: ${proxy.host}:${proxy.port} (${proxy.responseTime}ms)`);
        }
      }
    } catch (error) {
      console.error('❌ Error during proxy setup:', error);
      console.log('⚠️  Will run tests without proxy (default location only).');
    }
    
    console.log('==================================================\n');
  });
  
  test('Visit and scroll all pages from multiple locations', async () => {
    // Increased timeout to 40 mins to account for multiple proxy runs
    test.setTimeout(2400000);
    
    const allResults: LocationTestResult[] = [];
    
    // Test configurations: proxies + one default location
    const testConfigs = [
      // Direct connection (no proxy) as baseline
      { proxy: undefined, location: 'Default (No Proxy)' },
      // Working proxies
      ...workingProxies.map(proxy => ({ 
        proxy, 
        location: `${proxy.country} - ${proxy.host}` 
      }))
    ];
    
    console.log(`\n🚀 Starting health checks from ${testConfigs.length} locations...\n`);
    console.log(`\n🚀 Starting health checks from ${testConfigs.length} locations...\n`);
    
    // Run health check for each location
    for (let i = 0; i < testConfigs.length; i++) {
      const config = testConfigs[i];
      const locationName = config.location;
      
      await test.step(`Location ${i + 1}/${testConfigs.length}: ${locationName}`, async () => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📍 TESTING FROM: ${locationName}`);
        console.log('='.repeat(60));
        
        const failures: PageFailure[] = [];
        let browser;
        let context;
        
        try {
          // Launch browser with proxy configuration
          const userAgent = getRandomUserAgent();
          const geo = getRandomGeolocation();
          
          const browserSetup = await launchBrowserWithProxy({
            proxy: config.proxy,
            userAgent,
            geolocation: geo
          });
          
          browser = browserSetup.browser;
          context = browserSetup.context;
          const page = await context.newPage();
          
          console.log(`🌐 User-Agent: ${userAgent}`);
          console.log(`📍 Geolocation: ${geo.name} (${geo.latitude}, ${geo.longitude})`);
          if (config.proxy) {
            console.log(`🔒 Proxy: ${config.proxy.protocol}://${config.proxy.host}:${config.proxy.port} (${config.proxy.responseTime}ms)`);
          }
          console.log('');
          
          // Build final page list: homepage first, shuffled inner pages, homepage last
          const pagesToTest = [
            'https://www.stockscanner.net',
            ...shuffleArray(innerPages),
            'https://www.stockscanner.net'
          ];
          
          // Visit each page
          for (let pageIndex = 0; pageIndex < pagesToTest.length; pageIndex++) {
            const url = pagesToTest[pageIndex];
            
            console.log(`  [${pageIndex + 1}/${pagesToTest.length}] ${url}...`);
            
            try {
              await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
              
              // Verify basic element exists to confirm page load
              await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
              
              // Perform the scrolling
              await humanScroll(page);
              
              console.log(`      ✅ Success`);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error(`      ❌ Failed: ${errorMessage}`);
              failures.push({ 
                url, 
                error: errorMessage,
                location: locationName 
              });
            }
          }
          
          // Close browser
          await browser.close();
          
          // Store result
          allResults.push({
            location: locationName,
            proxy: config.proxy,
            success: failures.length === 0,
            failures,
            timestamp: new Date()
          });
          
          if (failures.length === 0) {
            console.log(`\n✅ All pages checked successfully from ${locationName}!`);
          } else {
            console.log(`\n⚠️  ${failures.length} page(s) failed from ${locationName}`);
          }
          
        } catch (error) {
          console.error(`\n❌ Critical error testing from ${locationName}:`, error);
          
          if (browser) {
            await browser.close().catch(() => {});
          }
          
          allResults.push({
            location: locationName,
            proxy: config.proxy,
            success: false,
            failures: [{ 
              url: 'N/A', 
              error: error instanceof Error ? error.message : String(error),
              location: locationName
            }],
            timestamp: new Date()
          });
        }
      });
    }
    
    // Final comprehensive report
    console.log('\n\n');
    console.log('='.repeat(70));
    console.log('📊 FINAL MULTI-LOCATION HEALTH CHECK REPORT');
    console.log('='.repeat(70));
    
    const successfulLocations = allResults.filter(r => r.success);
    const failedLocations = allResults.filter(r => !r.success);
    
    console.log(`\n✅ Successful: ${successfulLocations.length}/${allResults.length} locations`);
    for (const result of successfulLocations) {
      console.log(`   • ${result.location}`);
    }
    
    if (failedLocations.length > 0) {
      console.log(`\n❌ Failed: ${failedLocations.length}/${allResults.length} locations`);
      for (const result of failedLocations) {
        console.log(`\n   • ${result.location}:`);
        for (const failure of result.failures) {
          console.log(`     - ${failure.url}: ${failure.error}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(70) + '\n');
    
    // Throw error if any location failed
    if (failedLocations.length > 0) {
      throw new Error(
        `Health check failed for ${failedLocations.length}/${allResults.length} locations: ${
          failedLocations.map(r => r.location).join(', ')
        }`
      );
    }
  });
});