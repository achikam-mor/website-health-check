import { test, expect, Page } from '@playwright/test';
import { fetchAllProxies, getRegionalProxies, getHardcodedProxies } from './src/proxy-providers';
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

// Convert HTTPS URL to HTTP (for proxy compatibility)
function toHttpUrl(url: string): string {
  return url.replace('https://', 'http://');
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
// Note: These will be converted to HTTP when using proxies
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
      // First, try hardcoded proxies if available
      const hardcodedProxies = getHardcodedProxies();
      
      if (hardcodedProxies.length > 0) {
        console.log('🔍 Validating hardcoded proxies...');
        const validatedHardcoded = await validateProxies(hardcodedProxies, 10, 10000);
        const workingHardcoded = validatedHardcoded.filter(p => p.validated);
        
        if (workingHardcoded.length > 0) {
          console.log(`✅ ${workingHardcoded.length}/${hardcodedProxies.length} hardcoded proxies are working`);
          workingProxies = selectDiverseProxies(workingHardcoded, 7);
          
          console.log(`\n✅ Using ${workingProxies.length} validated hardcoded proxies:`);
          for (const proxy of workingProxies) {
            console.log(`   • ${proxy.country}: ${proxy.host}:${proxy.port} (${proxy.responseTime}ms)`);
          }
          console.log('==================================================\n');
          return; // Skip API fetching
        } else {
          console.log('⚠️  All hardcoded proxies failed. Falling back to API proxy sources...\n');
        }
      }
      
      // Fallback: Fetch proxies from APIs
      console.log('🔍 Fetching proxies from API sources...');
      const allProxies = await fetchAllProxies();
      
      if (allProxies.length === 0) {
        console.log('⚠️  No proxies fetched. Will run tests without proxy (default location only).');
        return;
      }
      
      // Filter to get regional diversity (test more proxies to find working ones)
      const regionalProxies = getRegionalProxies(allProxies, 5); // 5 proxies per priority region
      const proxiesToValidate = regionalProxies.slice(0, 60); // Max 60 proxies
      console.log(`📍 Selected ${proxiesToValidate.length} regional proxies for validation`);
      
      // Validate proxies (concurrency: 20, timeout: 10s per proxy)
      const validatedProxies = await validateProxies(proxiesToValidate, 20, 10000);
      
      // Log ALL working proxies for reference
      const allWorking = validatedProxies.filter(p => p.validated);
      if (allWorking.length > 0) {
        console.log(`\n✅ All ${allWorking.length} working proxies (sorted by speed):`);
        allWorking.sort((a, b) => (a.responseTime || 0) - (b.responseTime || 0));
        for (const proxy of allWorking.slice(0, 15)) {
          console.log(`   { host: '${proxy.host}', port: ${proxy.port}, protocol: '${proxy.protocol}', country: '${proxy.country}', source: 'Manual' }, // ${proxy.responseTime}ms`);
        }
        console.log('');
      }
      
      // Select diverse working proxies from different regions (target 5-7)
      workingProxies = selectDiverseProxies(validatedProxies, 7);
      
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
    // Increased timeout for parallel execution
    test.setTimeout(2400000);
    
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
    
    console.log(`\n🚀 Starting health checks from ${testConfigs.length} locations IN PARALLEL...\n`);
    
    // Function to test a single location
    const testLocation = async (config: typeof testConfigs[0], index: number): Promise<LocationTestResult> => {
      const locationName = config.location;
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📍 [${index + 1}/${testConfigs.length}] TESTING FROM: ${locationName}`);
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
          console.log(`ℹ️  Note: Using HTTP protocol with proxy (free proxies don't support HTTPS tunneling)`);
        }
        console.log('');
        
        // Build final page list: homepage first, shuffled inner pages, homepage last
        // Use HTTP URLs when using proxy for compatibility
        const useHttp = !!config.proxy;
        const pagesToTest = [
          useHttp ? toHttpUrl('https://www.stockscanner.net') : 'https://www.stockscanner.net',
          ...shuffleArray(innerPages.map(url => useHttp ? toHttpUrl(url) : url)),
          useHttp ? toHttpUrl('https://www.stockscanner.net') : 'https://www.stockscanner.net'
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
        
        // Log result for this location
        if (failures.length === 0) {
          console.log(`\n✅ All pages checked successfully from ${locationName}!`);
        } else {
          console.log(`\n⚠️  ${failures.length} page(s) failed from ${locationName}`);
        }
        
        return {
          location: locationName,
          proxy: config.proxy,
          success: failures.length === 0,
          failures,
          timestamp: new Date()
        };
        
      } catch (error) {
        console.error(`\n❌ Critical error testing from ${locationName}:`, error);
        
        if (browser) {
          await browser.close().catch(() => {});
        }
        
        return {
          location: locationName,
          proxy: config.proxy,
          success: false,
          failures: [{ 
            url: 'N/A', 
            error: error instanceof Error ? error.message : String(error),
            location: locationName
          }],
          timestamp: new Date()
        };
      }
    };
    
    // Run all location tests in parallel!
    const allResults = await Promise.all(
      testConfigs.map((config, index) => testLocation(config, index))
    );
    
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
    
    // Fail only if default location (no proxy) failed
    const defaultLocationFailed = failedLocations.find(loc => loc.location === 'Default (No Proxy)');
    
    if (defaultLocationFailed) {
      throw new Error(
        `Health check failed for default location (no proxy). This indicates the website is down or unreachable.`
      );
    }
    
    // If only proxy locations failed, warn but don't fail the test
    if (failedLocations.length > 0) {
      console.log('⚠️  Note: Some proxy locations failed, but the website is reachable (default location passed).');
      console.log('    This is expected with free proxies that may not support HTTPS tunneling.');
    }
  });
});