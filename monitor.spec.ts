import { test, expect, Page } from '@playwright/test';
import { fetchAllProxies, getRegionalProxies, getHardcodedProxies } from './src/proxy-providers';
import { validateProxies, selectDiverseProxies, ValidatedProxy } from './src/proxy-validator';
import { launchBrowserWithProxy, launchBrowserWithProxyium, getLocationName } from './src/browser-factory';

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Referrer sources for traffic variation (GA tracks this)
const referrerSources = [
  '', // Direct traffic (40%)
  'https://www.google.com/search?q=stock+scanner', // Google search
  'https://www.google.com/search?q=stock+market+tools',
  'https://www.bing.com/search?q=stock+analysis',
  'https://www.reddit.com/r/stocks/', // Social media
  'https://twitter.com/',
  'https://finance.yahoo.com/', // Finance sites
  'https://www.investopedia.com/',
];

// Get random referrer (weighted towards direct traffic)
function getRandomReferrer(): string {
  const random = Math.random();
  if (random < 0.4) {
    return ''; // 40% direct traffic
  }
  return referrerSources[Math.floor(Math.random() * referrerSources.length)];
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

// Get a unique user agent based on index (ensures each location gets different UA)
function getUniqueUserAgent(index: number): string {
  return userAgents[index % userAgents.length];
}

// Get a unique geolocation based on index (ensures each location gets different geo)
function getUniqueGeolocation(index: number): { latitude: number; longitude: number; name: string } {
  return geolocations[index % geolocations.length];
}

// Get language header based on geolocation
function getLanguageHeader(geoName: string): string {
  if (geoName.includes('USA') || geoName.includes('Seattle') || geoName.includes('New York') || geoName.includes('Chicago')) {
    return 'en-US,en;q=0.9';
  } else if (geoName.includes('Canada')) {
    return 'en-CA,en;q=0.9,fr-CA;q=0.8';
  } else if (geoName.includes('UK') || geoName.includes('London')) {
    return 'en-GB,en;q=0.9';
  } else if (geoName.includes('France') || geoName.includes('Paris')) {
    return 'fr-FR,fr;q=0.9,en;q=0.8';
  } else if (geoName.includes('Germany') || geoName.includes('Berlin')) {
    return 'de-DE,de;q=0.9,en;q=0.8';
  } else if (geoName.includes('Netherlands') || geoName.includes('Amsterdam')) {
    return 'nl-NL,nl;q=0.9,en;q=0.8';
  } else if (geoName.includes('Spain') || geoName.includes('Barcelona')) {
    return 'es-ES,es;q=0.9,en;q=0.8';
  } else if (geoName.includes('Belgium') || geoName.includes('Brussels')) {
    return 'fr-BE,nl-BE;q=0.9,en;q=0.8';
  }
  return 'en-US,en;q=0.9';
}

// Get language header based on country (for proxy locations)
function getLanguageForCountry(country: string): string {
  if (country.includes('United States') || country.includes('USA')) {
    return 'en-US,en;q=0.9';
  } else if (country.includes('Canada')) {
    return 'en-CA,en;q=0.9,fr-CA;q=0.8';
  } else if (country.includes('United Kingdom') || country.includes('UK')) {
    return 'en-GB,en;q=0.9';
  } else if (country.includes('France')) {
    return 'fr-FR,fr;q=0.9,en;q=0.8';
  } else if (country.includes('Germany')) {
    return 'de-DE,de;q=0.9,en;q=0.8';
  } else if (country.includes('Netherlands')) {
    return 'nl-NL,nl;q=0.9,en;q=0.8';
  } else if (country.includes('Spain')) {
    return 'es-ES,es;q=0.9,en;q=0.8';
  } else if (country.includes('Belgium')) {
    return 'fr-BE,nl-BE;q=0.9,en;q=0.8';
  } else if (country.includes('Italy')) {
    return 'it-IT,it;q=0.9,en;q=0.8';
  } else if (country.includes('Poland')) {
    return 'pl-PL,pl;q=0.9,en;q=0.8';
  } else if (country.includes('Russia')) {
    return 'ru-RU,ru;q=0.9,en;q=0.8';
  } else if (country.includes('Cyprus')) {
    return 'el-CY,el;q=0.9,en;q=0.8';
  } else if (country.includes('Costa Rica')) {
    return 'es-CR,es;q=0.9,en;q=0.8';
  } else if (country.includes('Singapore')) {
    return 'en-SG,en;q=0.9,zh;q=0.8';
  } else if (country.includes('Japan')) {
    return 'ja-JP,ja;q=0.9,en;q=0.8';
  } else if (country.includes('China')) {
    return 'zh-CN,zh;q=0.9,en;q=0.8';
  } else if (country.includes('India')) {
    return 'en-IN,en;q=0.9,hi;q=0.8';
  } else if (country.includes('Brazil')) {
    return 'pt-BR,pt;q=0.9,en;q=0.8';
  } else if (country.includes('Australia')) {
    return 'en-AU,en;q=0.9';
  }
  return 'en-US,en;q=0.9';
}

// Get approximate coordinates for a city (used when GeoIP provides city)
function getCoordinatesForCity(city: string, country: string): { latitude: number; longitude: number } {
  const cityKey = `${city}, ${country}`.toLowerCase();
  
  // Major cities coordinates
  const cityCoords: { [key: string]: { latitude: number; longitude: number } } = {
    'amsterdam, netherlands': { latitude: 52.3676, longitude: 4.9041 },
    'london, united kingdom': { latitude: 51.5074, longitude: -0.1278 },
    'paris, france': { latitude: 48.8566, longitude: 2.3522 },
    'berlin, germany': { latitude: 52.5200, longitude: 13.4050 },
    'madrid, spain': { latitude: 40.4168, longitude: -3.7038 },
    'rome, italy': { latitude: 41.9028, longitude: 12.4964 },
    'new york, united states': { latitude: 40.7128, longitude: -74.0060 },
    'los angeles, united states': { latitude: 34.0522, longitude: -118.2437 },
    'chicago, united states': { latitude: 41.8781, longitude: -87.6298 },
    'toronto, canada': { latitude: 43.6532, longitude: -79.3832 },
    'sydney, australia': { latitude: -33.8688, longitude: 151.2093 },
    'tokyo, japan': { latitude: 35.6762, longitude: 139.6503 },
    'moscow, russia': { latitude: 55.7558, longitude: 37.6173 },
    'novosibirsk, russia': { latitude: 55.0084, longitude: 82.9357 },
    'kaliningrad, russia': { latitude: 54.7104, longitude: 20.4522 },
    'nicosia, cyprus': { latitude: 35.1856, longitude: 33.3823 },
    'pozos, costa rica': { latitude: 9.9281, longitude: -84.0907 },
    'singapore, singapore': { latitude: 1.3521, longitude: 103.8198 },
  };
  
  // Try exact match
  if (cityCoords[cityKey]) {
    return cityCoords[cityKey];
  }
  
  // Default coordinates by country
  const countryDefaults: { [key: string]: { latitude: number; longitude: number } } = {
    'netherlands': { latitude: 52.3676, longitude: 4.9041 },
    'united kingdom': { latitude: 51.5074, longitude: -0.1278 },
    'france': { latitude: 48.8566, longitude: 2.3522 },
    'germany': { latitude: 52.5200, longitude: 13.4050 },
    'spain': { latitude: 40.4168, longitude: -3.7038 },
    'italy': { latitude: 41.9028, longitude: 12.4964 },
    'united states': { latitude: 37.0902, longitude: -95.7129 },
    'canada': { latitude: 45.5017, longitude: -73.5673 },
    'russia': { latitude: 55.7558, longitude: 37.6173 },
    'cyprus': { latitude: 35.1856, longitude: 33.3823 },
    'costa rica': { latitude: 9.9281, longitude: -84.0907 },
    'singapore': { latitude: 1.3521, longitude: 103.8198 },
  };
  
  const countryLower = country.toLowerCase();
  for (const [key, coords] of Object.entries(countryDefaults)) {
    if (countryLower.includes(key)) {
      return coords;
    }
  }
  
  // Fallback to center of Europe
  return { latitude: 50.0, longitude: 10.0 };
}

// Common screen resolutions
const screenResolutions = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 2560, height: 1440 },
  { width: 1600, height: 900 },
  { width: 1680, height: 1050 },
  { width: 1280, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1920, height: 1200 },
  { width: 2048, height: 1152 },
  { width: 3840, height: 2160 },
];

// Get unique viewport based on index
function getUniqueViewport(index: number) {
  return screenResolutions[index % screenResolutions.length];
}

// Get hardware fingerprint based on user agent
function getHardwareFingerprint(userAgent: string) {
  const isWindows = userAgent.includes('Windows');
  const isMac = userAgent.includes('Macintosh');
  const isLinux = userAgent.includes('Linux');
  
  // Color depth varies by device (24 or 32 bit)
  const colorDepth = Math.random() > 0.5 ? 24 : 32;
  
  // CPU cores vary (2, 4, 6, 8, 12, 16)
  const cpuCores = [2, 4, 6, 8, 12, 16][Math.floor(Math.random() * 6)];
  
  // Device memory in GB (2, 4, 8, 16, 32)
  const deviceMemory = [2, 4, 8, 16, 32][Math.floor(Math.random() * 5)];
  
  // Platform string
  let platform = 'Win32';
  if (isMac) platform = 'MacIntel';
  else if (isLinux) platform = 'Linux x86_64';
  
  return { colorDepth, cpuCores, deviceMemory, platform };
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

// Function to simulate human-like scrolling with complete randomization
async function humanScroll(page: Page) {
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  
  // Randomize scroll behavior: some users scroll all the way, some don't
  const scrollPercentage = Math.random() * 0.5 + 0.4; // 40-90% of page
  const targetScroll = scrollHeight * scrollPercentage;
  
  // Random scroll speed (some users scroll faster than others)
  const scrollSpeed = Math.random() * 0.5 + 0.5; // 0.5x to 1.0x speed multiplier
  
  // 1. Scroll Down
  let currentScroll = 0;
  while (currentScroll < targetScroll) {
    // Variable step size (100-400px)
    const step = Math.floor(Math.random() * 300) + 100;
    currentScroll += step;
    if (currentScroll > targetScroll) currentScroll = targetScroll;

    await page.evaluate((y) => window.scrollTo(0, y), currentScroll);
    
    // Variable pause while "reading" (200ms to 2000ms, affected by scroll speed)
    const pause = Math.floor((Math.random() * 1800 + 200) / scrollSpeed);
    await page.waitForTimeout(pause);
  }

  // 2. Random pause at reading position (1-4 seconds)
  await page.waitForTimeout(Math.floor(Math.random() * 3000) + 1000);

  // 3. Some users scroll back up (70% chance), others just leave
  if (Math.random() < 0.7) {
    const scrollUpTarget = Math.random() * currentScroll; // Scroll to random position, not always top
    while (currentScroll > scrollUpTarget) {
      const step = Math.floor(Math.random() * 300) + 200;
      currentScroll -= step;
      if (currentScroll < scrollUpTarget) currentScroll = scrollUpTarget;

      await page.evaluate((y) => window.scrollTo(0, y), currentScroll);
      const pause = Math.floor(Math.random() * 400 + 100);
      await page.waitForTimeout(pause);
    }
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
      let workingHardcoded: ValidatedProxy[] = [];
      
      if (hardcodedProxies.length > 0) {
        console.log(`✅ Using top ${hardcodedProxies.length} proxies WITHOUT validation (faster startup)`);
        
        // Use all proxies directly without validation
        workingProxies = hardcodedProxies.map(p => ({
          ...p,
          validated: true,
          responseTime: p.responseTime || 1000
        })) as ValidatedProxy[];
        
        // Count proxies with known countries
        const knownCountryCount = workingProxies.filter(p => p.country !== 'Unknown').length;
        
        console.log(`\n✅ Using ${workingProxies.length} proxies from working-proxies.json:`);
        console.log(`   📍 ${knownCountryCount} proxies with known countries (prioritized)`);
        console.log(`   ⚡ ${workingProxies.length - knownCountryCount} fastest proxies (by response time)\n`);
        
        // Show all proxies
        for (let i = 0; i < workingProxies.length; i++) {
          const p = workingProxies[i];
          console.log(`   ${i+1}. ${p.host}:${p.port} (${p.country}) - ${p.responseTime}ms`);
        }
        console.log('==================================================\n');
        return;
      }
      
      // Fallback: Fetch proxies from APIs
      console.log('🔍 Fetching proxies from API sources...');
      const allProxies = await fetchAllProxies();
      
      if (allProxies.length === 0) {
        console.log('⚠️  No proxies fetched. Will run tests without proxy (default location only).');
        return;
      }
      
      // Filter to get regional diversity (test more proxies to find working ones)
      const regionalProxies = getRegionalProxies(allProxies, 50); // 50 proxies per priority region (non-US)
      const proxiesToValidate = regionalProxies.slice(0, 1000); // Validate up to 1000 proxies for comprehensive discovery
      console.log(`📍 Selected ${proxiesToValidate.length} regional proxies for validation`);
      
      // Validate proxies with cross-reference GeoIP verification
      console.log('🌍 Cross-referencing proxy locations with multiple GeoIP services...');
      const validatedProxies = await validateProxies(proxiesToValidate);
      
      // Filter for ONLY non-US proxies that are verified
      const nonUSProxies = validatedProxies.filter(p => 
        p.validated && 
        p.verified && 
        p.realCountry && 
        !p.realCountry.toLowerCase().includes('united states') &&
        !p.realCountry.toLowerCase().includes('usa')
      );
      
      console.log(`✅ Found ${nonUSProxies.length} verified non-US proxies out of ${validatedProxies.filter(p => p.validated).length} working proxies`);
      
      if (nonUSProxies.length === 0) {
        console.log('⚠️  No verified non-US proxies found. Using only hardcoded proxies.');
        return;
      }
      
      // Calculate how many API proxies to add (target 19 total, minus hardcoded)
      const targetTotal = 19;
      const neededFromAPI = Math.max(0, targetTotal - (workingHardcoded?.length || 0));
      
      // Randomize and select diverse working proxies from non-US pool
      const shuffledNonUS = shuffleArray(nonUSProxies);
      const apiProxies = selectDiverseProxies(shuffledNonUS, neededFromAPI);
      
      // ADD non-US proxies to existing hardcoded list (don't replace)
      if (workingHardcoded && workingHardcoded.length > 0) {
        console.log(`\n✅ Adding ${apiProxies.length} verified non-US proxies to ${workingHardcoded.length} hardcoded proxies`);
        workingProxies = [...workingHardcoded, ...apiProxies];
      } else {
        workingProxies = apiProxies;
      }
      
      if (workingProxies.length === 0) {
        console.log('⚠️  No working proxies found. Will run tests without proxy (default location only).');
      } else {
        console.log(`\n✅ Found ${workingProxies.length} working proxies:`);
        
        // Log country distribution
        const countryDist = new Map<string, number>();
      for (const proxy of workingProxies) {
        const country = proxy.realCountry || proxy.country;
        countryDist.set(country, (countryDist.get(country) || 0) + 1);
      }
      console.log('📊 Country distribution:');
      for (const [country, count] of countryDist) {
        console.log(`   ${country}: ${count} proxies`);
      }
      console.log(`\n📌 Note: API proxies filtered for verified non-US locations only`);
      console.log(`📌 Hardcoded proxies retained regardless of location\n`);
      for (const proxy of workingProxies) {
          const location = proxy.realCity && proxy.realCountry 
            ? `${proxy.realCity}, ${proxy.realCountry}` 
            : (proxy.realCountry || proxy.country);
          console.log(`   • ${location}: ${proxy.host}:${proxy.port} (${proxy.responseTime}ms)`);
        }
      }
    } catch (error) {
      console.error('❌ Error during proxy setup:', error);
      console.log('⚠️  Will run tests without proxy (default location only).');
    }
    
    console.log('==================================================\n');
  });
  
  test('Visit and scroll all pages from multiple locations', async () => {
    // Timeout for PARALLEL execution with staggered starts
    // 12 sessions × ~60-120s per session + ~12s stagger = ~2-3 minutes total
    test.setTimeout(600000); // 10 minutes
    
    // Randomly select 10 proxies from top 25 for this execution
    const top25Proxies = workingProxies.slice(0, 25);
    const shuffledProxies = shuffleArray(top25Proxies);
    const selectedProxies = shuffledProxies.slice(0, 10);
    
    console.log(`\n🎲 Randomly selected ${selectedProxies.length} proxies from top 25 for this execution\n`);
    
    // Test configurations: 1 direct + 1 proxyium + 10 random proxies = 12 total
    const testConfigs = [
      // Direct connection (no proxy) as baseline
      { proxy: undefined, location: 'Direct (GitHub Runner)', type: 'direct' },
      // Proxyium web proxy
      { proxy: undefined, location: 'Proxyium Web Proxy', type: 'proxyium' },
      // Random 10 proxies from top 25
      ...selectedProxies.map(proxy => ({ 
        proxy, 
        location: `${proxy.country} - ${proxy.host}`,
        type: 'proxy'
      }))
    ];
    
    console.log(`\n🚀 Starting health checks from ${testConfigs.length} locations IN PARALLEL (1-3s stagger)...`);
    console.log(`   📍 1 Direct GitHub connection (no proxy)`);
    console.log(`   📍 1 Proxyium web proxy`);
    console.log(`   📍 ${selectedProxies.length} Randomly selected proxy locations\n`);
    
    // Function to test a single location
    const testLocation = async (config: typeof testConfigs[0], index: number, startDelay: number): Promise<LocationTestResult> => {
      // Stagger the start with random delay
      if (startDelay > 0) {
        console.log(`⏳ [${index + 1}/${testConfigs.length}] Waiting ${(startDelay/1000).toFixed(1)}s before launching: ${config.location}`);
        await new Promise(resolve => setTimeout(resolve, startDelay));
      }
      
      const locationName = config.location;
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📍 [${index + 1}/${testConfigs.length}] STARTING: ${locationName}`);
      console.log('='.repeat(60));
      
      const failures: PageFailure[] = [];
      let browser;
      let context;
      let isProxyium = false;
      
      try {
        // Launch browser based on type
        const userAgent = getUniqueUserAgent(index); // Unique UA per location
        const viewport = getUniqueViewport(index); // Unique screen size per location
        const hardware = getHardwareFingerprint(userAgent); // Hardware specs
        const referrer = getRandomReferrer(); // Traffic source
        
        // CRITICAL: Match geolocation to proxy's actual location for consistency
        let geo, language;
        if (config.proxy && config.proxy.realCity && config.proxy.realCountry) {
          // Use proxy's real location
          const coords = getCoordinatesForCity(config.proxy.realCity, config.proxy.realCountry);
          geo = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            name: `${config.proxy.realCity}, ${config.proxy.realCountry}`
          };
          language = getLanguageForCountry(config.proxy.realCountry);
        } else {
          // No proxy or location unknown - use random geo
          geo = getUniqueGeolocation(index);
          language = getLanguageHeader(geo.name);
        }
        
        // Choose launcher based on type
        let browserSetup;
        if (config.type === 'proxyium') {
          // Use proxyium launcher (handles popups internally)
          browserSetup = await launchBrowserWithProxyium({
            userAgent,
            geolocation: geo,
            viewport,
            language: language,
            hardware,
            referrer
          });
          isProxyium = true;
        } else {
          // Use standard proxy launcher
          browserSetup = await launchBrowserWithProxy({
            proxy: config.proxy,
            userAgent,
            geolocation: geo,
            viewport,
            language: language,
            timezone: config.proxy?.timezone,
            hardware,
            referrer
          });
        }
        
        browser = browserSetup.browser;
        context = browserSetup.context;
        
        // Get or create page
        let page;
        if (isProxyium) {
          // Proxyium already has a page open on the target site
          const pages = context.pages();
          page = pages[0] || await context.newPage();
        } else {
          page = await context.newPage();
        }
        
        // Generate and log unique GA Client ID for verification
        const gaClientId = `GA1.2.${Math.floor(Math.random() * 2147483647)}.${Math.floor(Date.now() / 1000)}`;
        
        // Config ready (detailed logs removed for cleaner output)
        
        // Randomize behavior: each user visits different number of pages (5-10) in random order
        const useHttp = !!config.proxy && config.type !== 'proxyium';
        const numPagesToVisit = Math.floor(Math.random() * 6) + 5; // 5-10 pages
        
        // Shuffle pages and select random subset
        const shuffledPages = shuffleArray([...innerPages]);
        const selectedPages = shuffledPages.slice(0, numPagesToVisit - 2); // -2 for homepage visits
        
        // Randomly decide homepage visit pattern
        const homepagePattern = Math.floor(Math.random() * 3);
        const homepage = useHttp ? toHttpUrl('https://www.stockscanner.net') : 'https://www.stockscanner.net';
        const mappedPages = selectedPages.map(url => useHttp ? toHttpUrl(url) : url);
        
        let pagesToTest: string[];
        if (homepagePattern === 0) {
          // Start with homepage, end with homepage
          pagesToTest = [homepage, ...mappedPages, homepage];
        } else if (homepagePattern === 1) {
          // Start with homepage only
          pagesToTest = [homepage, ...mappedPages];
        } else {
          // Homepage in random position
          const randomPos = Math.floor(Math.random() * (mappedPages.length + 1));
          pagesToTest = [...mappedPages.slice(0, randomPos), homepage, ...mappedPages.slice(randomPos)];
        }
        
        // Random initial delay (1-5 seconds) - simulates human hesitation before starting
        await page.waitForTimeout(Math.floor(Math.random() * 4000) + 1000);
        
        // Visit each page
        for (let pageIndex = 0; pageIndex < pagesToTest.length; pageIndex++) {
          const url = pagesToTest[pageIndex];
          
          // Random early exit (10% chance after 3rd page) - realistic user behavior
          if (pageIndex >= 3 && Math.random() < 0.1) {
            // User left early
            break;
          }
          
          // Visiting page silently
          
          // Random delay between pages (3-12 seconds) - varies by user behavior
          if (pageIndex > 0) {
            const delay = Math.floor(Math.random() * 9000) + 3000; // 3-12 seconds
            await page.waitForTimeout(delay);
          }
          
          // Simulate variable network speed (throttle randomly)
          if (Math.random() < 0.2) {
            // 20% chance: simulate slower connection
            const networkProfiles = [
              { latency: 40, download: 1500, upload: 750 },   // Fast 3G
              { latency: 20, download: 5000, upload: 1000 },  // 4G
              { latency: 150, download: 400, upload: 400 },   // Slow 3G
            ];
            const profile = networkProfiles[Math.floor(Math.random() * networkProfiles.length)];
            await context.route('**/*', async (route) => {
              await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
              await route.continue();
            });
          }
          
          try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // Verify basic element exists to confirm page load
            await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
            
            // Simulate realistic mouse movement (CRITICAL for bot detection)
            const numMouseMoves = Math.floor(Math.random() * 5) + 3; // 3-8 moves
            for (let i = 0; i < numMouseMoves; i++) {
              const x = Math.floor(Math.random() * viewport.width);
              const y = Math.floor(Math.random() * viewport.height);
              await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 5) + 5 });
              await page.waitForTimeout(Math.floor(Math.random() * 300) + 100);
            }
            
            // Simulate keyboard activity (20% chance - realistic browsing)
            if (Math.random() < 0.2) {
              // Simulate common keyboard actions
              const actions = [
                async () => {
                  // Ctrl+F (search) then Escape
                  await page.keyboard.down('Control');
                  await page.keyboard.press('KeyF');
                  await page.keyboard.up('Control');
                  await page.waitForTimeout(Math.floor(Math.random() * 500) + 200);
                  await page.keyboard.press('Escape');
                },
                async () => {
                  // Arrow key scrolling
                  const numPresses = Math.floor(Math.random() * 3) + 2;
                  for (let i = 0; i < numPresses; i++) {
                    await page.keyboard.press('ArrowDown');
                    await page.waitForTimeout(Math.floor(Math.random() * 300) + 100);
                  }
                },
                async () => {
                  // Spacebar scroll
                  await page.keyboard.press('Space');
                  await page.waitForTimeout(Math.floor(Math.random() * 800) + 400);
                },
                async () => {
                  // Home/End key
                  await page.keyboard.press(Math.random() > 0.5 ? 'Home' : 'End');
                  await page.waitForTimeout(Math.floor(Math.random() * 500) + 300);
                }
              ];
              
              const randomAction = actions[Math.floor(Math.random() * actions.length)];
              try {
                await randomAction();
              } catch (e) {}
            }
            
            // Occasionally simulate hover (50% chance)
            if (Math.random() < 0.5) {
              try {
                const links = await page.locator('a').count();
                if (links > 0) {
                  const randomLink = Math.floor(Math.random() * Math.min(links, 10));
                  await page.locator('a').nth(randomLink).hover({ timeout: 2000 });
                  await page.waitForTimeout(Math.floor(Math.random() * 500) + 200);
                }
              } catch (e) {}
            }
            
            // Random clicks on non-navigation elements (30% chance - VERY realistic)
            if (Math.random() < 0.3) {
              try {
                // Click on common interactive elements that don't navigate
                const selectors = ['button:not([type="submit"])', 'div[role="button"]', '[onclick]', '.clickable'];
                const selector = selectors[Math.floor(Math.random() * selectors.length)];
                const elements = await page.locator(selector).count();
                if (elements > 0) {
                  const randomEl = Math.floor(Math.random() * Math.min(elements, 5));
                  // Clicking interactive element
                  await page.locator(selector).nth(randomEl).click({ timeout: 2000, force: true });
                  await page.waitForTimeout(Math.floor(Math.random() * 1000) + 500);
                }
              } catch (e) {
                // Element might be hidden or not clickable - that's fine
              }
            }
            
            // Perform the scrolling
            await humanScroll(page);
            
            // CRITICAL: 1/1000 chance to click on Google Ad (simulates real user clicking ads)
            if (Math.random() < 0.001) {
              try {
                console.log(`      🎯 Attempting to click on Google Ad (1/1000 chance)...`);
                // Common Google Ad selectors
                const adSelectors = [
                  'ins.adsbygoogle',
                  'iframe[id*="google_ads"]',
                  'iframe[id*="aswift"]',
                  'div[id*="google_ads"]',
                  '[data-ad-slot]',
                  '.adsbygoogle'
                ];
                
                for (const selector of adSelectors) {
                  const ads = await page.locator(selector).count();
                  if (ads > 0) {
                    const randomAd = Math.floor(Math.random() * Math.min(ads, 3));
                    await page.locator(selector).nth(randomAd).click({ timeout: 2000, force: true });
                    console.log(`      ✓ Clicked on Google Ad!`);
                    await page.waitForTimeout(Math.floor(Math.random() * 3000) + 2000); // Stay on ad 2-5 seconds
                    // Go back to site
                    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
                    break;
                  }
                }
              } catch (e) {
                // Ad might not be clickable or blocked - that's fine
              }
            }
            
            // Random human behaviors (20% chance)
            const randomBehavior = Math.random();
            if (randomBehavior < 0.1 && pageIndex > 0) {
              // 10% chance: Go back then forward (user reconsidering)
              // Going back
              await page.goBack({ waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForTimeout(Math.floor(Math.random() * 2000) + 1000);
              await page.goForward({ waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForTimeout(Math.floor(Math.random() * 1000) + 500);
            } else if (randomBehavior < 0.15) {
              // 5% chance: Reload page (checking for updates)
              // Reloading
              await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForTimeout(Math.floor(Math.random() * 2000) + 1000);
            } else if (randomBehavior < 0.20) {
              // 5% chance: Extra long pause (user distracted/multitasking)
              const longPause = Math.floor(Math.random() * 8000) + 5000; // 5-13 seconds
              // Long pause
              await page.waitForTimeout(longPause);
            } else if (randomBehavior < 0.25) {
              // 5% chance: Simulate tab switching (user left to check something)
              // Tab unfocused
              await page.evaluate(() => {
                window.dispatchEvent(new Event('blur'));
                document.dispatchEvent(new Event('visibilitychange'));
              });
              await page.waitForTimeout(Math.floor(Math.random() * 3000) + 2000);
              await page.evaluate(() => {
                window.dispatchEvent(new Event('focus'));
                document.dispatchEvent(new Event('visibilitychange'));
              });
            }
            
            // Success
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
    
    // Run all location tests IN PARALLEL with staggered starts (1-3s between each)
    // This allows browsers to run simultaneously while starting with realistic delays
    console.log('⏱️  Launching all 27 sessions in parallel with staggered starts (1-3s between each)...\n');
    
    // Create promises with staggered delays
    const testPromises = testConfigs.map((config, index) => {
      // Calculate stagger delay: 0s for first, then 1-3s random for each subsequent
      const startDelay = index === 0 ? 0 : Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
      return testLocation(config, index, startDelay);
    });
    
    // Wait for all tests to complete (or fail)
    const results = await Promise.allSettled(testPromises);
    
    // Extract actual results from Promise.allSettled
    const allResults: LocationTestResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Promise was rejected
        return {
          location: testConfigs[index].location,
          proxy: testConfigs[index].proxy,
          success: false,
          failures: [{ 
            url: 'N/A', 
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
            location: testConfigs[index].location
          }],
          timestamp: new Date()
        };
      }
    });
    
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
    
    // Fail only if direct GitHub connection failed
    const directLocationFailed = failedLocations.find(loc => loc.location === 'Direct (GitHub Runner)');
    
    if (directLocationFailed) {
      throw new Error(
        `Health check failed for direct GitHub connection. This indicates the website is down or unreachable.`
      );
    }
    
    // If only proxy locations failed, warn but don't fail the test
    if (failedLocations.length > 0) {
      console.log('⚠️  Note: Some proxy locations failed, but the website is reachable (direct connection passed).');
      console.log('    This is expected with proxies that may be temporarily unavailable.');
    }
  });
});