/**
 * Proxy Validator Module
 * Tests proxy connectivity, speed, and anonymity
 */

import { chromium, Browser } from '@playwright/test';
import { ProxyInfo } from './proxy-providers';

export interface ValidatedProxy extends ProxyInfo {
  validated: boolean;
  responseTime?: number;
  error?: string;
  realCountry?: string;
  realCity?: string;
  timezone?: string;
  verified?: boolean;
}

/**
 * Get real location data for a proxy IP using free GeoIP API
 */
async function getProxyLocation(ip: string): Promise<{ country?: string; city?: string; timezone?: string }> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,timezone`, {
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) return {};
    const data = await response.json();
    if (data.status === 'success') {
      return {
        country: data.country,
        city: data.city,
        timezone: data.timezone
      };
    }
  } catch (error) {
    // Ignore errors, location data is optional
  }
  return {};
}

/**
 * Cross-reference location using multiple GeoIP services
 * Returns location only if at least 2 out of 3 services agree
 */
async function crossReferenceLocation(ip: string): Promise<{ country?: string; city?: string; timezone?: string; verified: boolean }> {
  const services = [
    // Service 1: ip-api.com
    async () => {
      try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,timezone`, {
          signal: AbortSignal.timeout(3000)
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (data.status === 'success') {
          return { country: data.country?.toLowerCase(), city: data.city, timezone: data.timezone };
        }
      } catch (error) {
        return null;
      }
      return null;
    },
    // Service 2: ipapi.co
    async () => {
      try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`, {
          signal: AbortSignal.timeout(3000)
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (data.country_name) {
          return { country: data.country_name?.toLowerCase(), city: data.city, timezone: data.timezone };
        }
      } catch (error) {
        return null;
      }
      return null;
    },
    // Service 3: ipinfo.io
    async () => {
      try {
        const response = await fetch(`https://ipinfo.io/${ip}/json`, {
          signal: AbortSignal.timeout(3000)
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (data.country) {
          return { country: data.country?.toLowerCase(), city: data.city, timezone: data.timezone };
        }
      } catch (error) {
        return null;
      }
      return null;
    }
  ];

  // Query all services in parallel
  const results = await Promise.all(services.map(service => service()));
  const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null && r.country !== undefined);

  if (validResults.length < 2) {
    return { verified: false };
  }

  // Check if at least 2 services agree on the country
  const countryCounts = new Map<string, number>();
  for (const result of validResults) {
    const country = result.country;
    if (country) {
      countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
    }
  }

  // Find the most agreed-upon country
  let maxCount = 0;
  let agreedCountry = '';
  for (const [country, count] of countryCounts) {
    if (count > maxCount) {
      maxCount = count;
      agreedCountry = country;
    }
  }

  // At least 2 services must agree
  if (maxCount >= 2) {
    const agreedResult = validResults.find(r => r.country === agreedCountry);
    if (agreedResult) {
      return {
        country: agreedResult.country,
        city: agreedResult.city,
        timezone: agreedResult.timezone,
        verified: true
      };
    }
  }

  return { verified: false };
}

/**
 * Test a single proxy by attempting to connect and load a test page
 */
export async function validateProxy(proxy: ProxyInfo, timeout: number = 15000, useGeoVerification: boolean = false): Promise<ValidatedProxy> {
  const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
  
  let browser: Browser | null = null;
  
  try {
    const startTime = Date.now();
    
    // Launch browser with proxy
    browser = await chromium.launch({
      headless: true,
      proxy: {
        server: proxyUrl
      }
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Set a timeout for the navigation
    page.setDefaultTimeout(timeout);
    
    // Test with HTTP site (proxies handle HTTP better than HTTPS tunneling)
    // Using httpbin.org which is reliable and proxy-friendly
    await page.goto('http://httpbin.org/get', { waitUntil: 'domcontentloaded' });
    
    // Verify the page loaded
    const content = await page.content();
    if (!content || content.length < 100) {
      throw new Error('Page did not load properly');
    }
    
    const responseTime = Date.now() - startTime;
    
    await browser.close();
    
    // Get location data (with cross-reference if requested)
    let location;
    if (useGeoVerification) {
      location = await crossReferenceLocation(proxy.host);
    } else {
      const basicLocation = await getProxyLocation(proxy.host);
      location = { ...basicLocation, verified: true };
    }
    
    return {
      ...proxy,
      validated: true,
      responseTime,
      realCountry: location.country,
      realCity: location.city,
      timezone: location.timezone,
      verified: location.verified
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (browser) {
      await browser.close().catch(() => {});
    }
    
    return {
      ...proxy,
      validated: false,
      error: errorMessage
    };
  }
}

/**
 * Validate multiple proxies in parallel
 */
export async function validateProxies(
  proxies: ProxyInfo[],
  concurrency: number = 5,
  timeout: number = 10000,
  useGeoVerification: boolean = false
): Promise<ValidatedProxy[]> {
  console.log(`🔍 Validating ${proxies.length} proxies (concurrency: ${concurrency})...`);
  
  const results: ValidatedProxy[] = [];
  
  // Process proxies in batches
  for (let i = 0; i < proxies.length; i += concurrency) {
    const batch = proxies.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(proxy => validateProxy(proxy, timeout, useGeoVerification))
    );
    
    results.push(...batchResults);
    
    const validCount = batchResults.filter(p => p.validated).length;
    console.log(`   Batch ${Math.floor(i / concurrency) + 1}: ${validCount}/${batch.length} valid`);
  }
  
  const validProxies = results.filter(p => p.validated);
  console.log(`✅ Validation complete: ${validProxies.length}/${proxies.length} proxies are working`);
  
  return results;
}

/**
 * Get the fastest N proxies from validated list
 */
export function getFastestProxies(proxies: ValidatedProxy[], count: number): ValidatedProxy[] {
  return proxies
    .filter(p => p.validated && p.responseTime)
    .sort((a, b) => (a.responseTime || 0) - (b.responseTime || 0))
    .slice(0, count);
}

/**
 * Get working proxies grouped by region
 */
export function getProxiesByRegion(proxies: ValidatedProxy[]): Map<string, ValidatedProxy[]> {
  const byRegion = new Map<string, ValidatedProxy[]>();
  
  for (const proxy of proxies) {
    if (!proxy.validated) continue;
    
    const region = proxy.country.toUpperCase();
    if (!byRegion.has(region)) {
      byRegion.set(region, []);
    }
    byRegion.get(region)!.push(proxy);
  }
  
  // Sort each region by response time
  for (const [region, regionProxies] of byRegion) {
    byRegion.set(
      region,
      regionProxies.sort((a, b) => (a.responseTime || 0) - (b.responseTime || 0))
    );
  }
  
  return byRegion;
}

/**
 * Select diverse working proxies from different COUNTRIES (max 2 per country)
 */
export function selectDiverseProxies(
  validatedProxies: ValidatedProxy[],
  targetCount: number = 5
): ValidatedProxy[] {
  const workingProxies = validatedProxies.filter(p => p.validated);
  
  if (workingProxies.length === 0) {
    return [];
  }
  
  // Group by country (prioritize country-level diversity)
  const byCountry = new Map<string, ValidatedProxy[]>();
  for (const proxy of workingProxies) {
    const country = proxy.realCountry || proxy.country;
    if (!byCountry.has(country)) {
      byCountry.set(country, []);
    }
    byCountry.get(country)!.push(proxy);
  }
  
  // Sort each country's proxies by response time
  for (const [country, countryProxies] of byCountry) {
    byCountry.set(country, countryProxies.sort((a, b) => (a.responseTime || 0) - (b.responseTime || 0)));
  }
  
  const selected: ValidatedProxy[] = [];
  const maxPerCountry = 2; // Max 2 proxies per country for diversity
  
  // Round-robin through countries, taking up to 2 from each
  const countries = Array.from(byCountry.keys());
  let round = 0;
  
  while (selected.length < targetCount && round < maxPerCountry) {
    for (const country of countries) {
      if (selected.length >= targetCount) break;
      
      const countryProxies = byCountry.get(country)!;
      if (countryProxies.length > round) {
        selected.push(countryProxies[round]);
      }
    }
    round++;
  }
  
  // If still need more, add fastest remaining
  if (selected.length < targetCount) {
    const fastest = getFastestProxies(workingProxies, targetCount * 2);
    for (const proxy of fastest) {
      if (selected.length >= targetCount) break;
      if (!selected.find(p => p.host === proxy.host && p.port === proxy.port)) {
        selected.push(proxy);
      }
    }
  }
  
  return selected.slice(0, targetCount);
}
