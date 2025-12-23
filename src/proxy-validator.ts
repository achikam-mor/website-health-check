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
    
    // Test with a simple, fast-loading page that's less likely to block proxies
    // Using example.com which is designed for testing and doesn't block proxies
    await page.goto('http://example.com', { waitUntil: 'domcontentloaded' });
    
    // Verify the page loaded
    const title = await page.title();
    if (!title) {
      throw new Error('Page did not load properly');
    }
    
    const responseTime = Date.now() - startTime;
    
    await browser.close();
    
    return {
      ...proxy,
      validated: true,
      responseTime
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
 * Select diverse working proxies from different regions
 */
export function selectDiverseProxies(
  validatedProxies: ValidatedProxy[],
  targetCount: number = 5
): ValidatedProxy[] {
  const workingProxies = validatedProxies.filter(p => p.validated);
  
  if (workingProxies.length === 0) {
    return [];
  }
  
  const byRegion = getProxiesByRegion(workingProxies);
  const selected: ValidatedProxy[] = [];
  
  // Priority regions
  const priorityRegions = ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'ES', 'IT'];
  
  // First pass: Get one proxy from each priority region
  for (const region of priorityRegions) {
    if (selected.length >= targetCount) break;
    
    const regionProxies = byRegion.get(region);
    if (regionProxies && regionProxies.length > 0) {
      selected.push(regionProxies[0]);
    }
  }
  
  // Second pass: Fill remaining slots with fastest proxies from any region
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
