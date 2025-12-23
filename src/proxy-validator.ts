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
 * Test a single proxy by attempting to connect and load a test page
 */
export async function validateProxy(proxy: ProxyInfo, timeout: number = 15000): Promise<ValidatedProxy> {
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
    
    // Get real location data for the proxy
    const location = await getProxyLocation(proxy.host);
    
    return {
      ...proxy,
      validated: true,
      responseTime,
      realCountry: location.country,
      realCity: location.city,
      timezone: location.timezone
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
  timeout: number = 15000
): Promise<ValidatedProxy[]> {
  console.log(`🔍 Validating ${proxies.length} proxies (concurrency: ${concurrency})...`);
  
  const results: ValidatedProxy[] = [];
  
  // Process proxies in batches
  for (let i = 0; i < proxies.length; i += concurrency) {
    const batch = proxies.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(proxy => validateProxy(proxy, timeout))
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
 * Select diverse working proxies from different CITIES (not just countries)
 */
export function selectDiverseProxies(
  validatedProxies: ValidatedProxy[],
  targetCount: number = 5
): ValidatedProxy[] {
  const workingProxies = validatedProxies.filter(p => p.validated);
  
  if (workingProxies.length === 0) {
    return [];
  }
  
  // Group by city (or country if city unknown)
  const byCity = new Map<string, ValidatedProxy[]>();
  for (const proxy of workingProxies) {
    const key = proxy.realCity ? `${proxy.realCity}, ${proxy.realCountry}` : proxy.country;
    if (!byCity.has(key)) {
      byCity.set(key, []);
    }
    byCity.get(key)!.push(proxy);
  }
  
  // Sort each city's proxies by response time
  for (const [city, cityProxies] of byCity) {
    byCity.set(city, cityProxies.sort((a, b) => (a.responseTime || 0) - (b.responseTime || 0)));
  }
  
  const selected: ValidatedProxy[] = [];
  
  // Strategy: Take 1-2 fastest from each unique city until we reach target
  const cities = Array.from(byCity.keys());
  let round = 0;
  const maxPerCity = 2; // Max 2 proxies per city
  
  while (selected.length < targetCount && round < maxPerCity) {
    for (const city of cities) {
      if (selected.length >= targetCount) break;
      
      const cityProxies = byCity.get(city)!;
      if (cityProxies.length > round) {
        selected.push(cityProxies[round]);
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
