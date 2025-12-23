/**
 * Script to find working proxies and generate hardcoded list
 * Run: node scripts/find-working-proxies.mjs
 */

import { chromium } from '@playwright/test';

// Fetch proxies from multiple sources
async function fetchProxies() {
  const proxies = [];
  
  try {
    // Try proxy-list.download
    console.log('Fetching from proxy-list.download...');
    const url = 'https://www.proxy-list.download/api/v1/get?type=http';
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    
    if (response.ok) {
      const text = await response.text();
      const lines = text.trim().split('\n');
      
      for (const line of lines) {
        const [host, portStr] = line.trim().split(':');
        if (host && portStr && !isNaN(parseInt(portStr))) {
          proxies.push({
            host,
            port: parseInt(portStr),
            protocol: 'http',
            country: 'Unknown',
            source: 'proxy-list.download'
          });
        }
      }
      console.log(`✓ Fetched ${proxies.length} proxies`);
    }
  } catch (error) {
    console.error('Error fetching proxies:', error.message);
  }
  
  return proxies;
}

// Validate a single proxy
async function validateProxy(proxy, timeout = 10000) {
  const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
  let browser = null;
  
  try {
    const startTime = Date.now();
    
    browser = await chromium.launch({
      headless: true,
      proxy: { server: proxyUrl }
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(timeout);
    
    await page.goto('http://httpbin.org/get', { waitUntil: 'domcontentloaded' });
    
    const content = await page.content();
    if (!content || content.length < 100) {
      throw new Error('Page did not load properly');
    }
    
    const responseTime = Date.now() - startTime;
    await browser.close();
    
    return { ...proxy, validated: true, responseTime };
    
  } catch (error) {
    if (browser) await browser.close().catch(() => {});
    return { ...proxy, validated: false, error: error.message };
  }
}

// Main function
async function findWorkingProxies() {
  console.log('🔍 Finding working proxies...\n');
  
  // Fetch proxies
  const allProxies = await fetchProxies();
  console.log(`Fetched ${allProxies.length} proxies\n`);
  
  if (allProxies.length === 0) {
    console.log('❌ No proxies found');
    return;
  }
  
  // Test ALL proxies to find working ones
  const proxiesToTest = allProxies;
  console.log(`Testing ALL ${proxiesToTest.length} proxies (concurrency: 20, timeout: 15s)...\n`);
  
  const working = [];
  
  // Validate in batches of 20 with longer timeout
  for (let i = 0; i < proxiesToTest.length; i += 20) {
    const batch = proxiesToTest.slice(i, i + 20);
    const results = await Promise.all(batch.map(p => validateProxy(p, 15000)));
    const validInBatch = results.filter(p => p.validated);
    working.push(...validInBatch);
    console.log(`  Batch ${Math.floor(i / 20) + 1}/${Math.ceil(proxiesToTest.length / 20)}: ${validInBatch.length}/${batch.length} valid (Total: ${working.length} working)`);
    
    // Stop if we found enough working proxies
    if (working.length >= 15) {
      console.log(`\n✅ Found ${working.length} working proxies! Stopping validation.\n`);
      break;
    }
  }
  
  console.log(`\n✅ Found ${working.length} working proxies!\n`);
  
  if (working.length === 0) {
    console.log('No working proxies found. Try running again.');
    return;
  }
  
  // Sort by response time
  working.sort((a, b) => a.responseTime - b.responseTime);
  
  // Generate code - ready to paste
  console.log('═'.repeat(80));
  console.log('📋 COPY THIS CODE AND PASTE INTO src/proxy-providers.ts');
  console.log('   Replace the HARDCODED_PROXIES array with this:');
  console.log('═'.repeat(80));
  console.log('');
  console.log('const HARDCODED_PROXIES: ProxyInfo[] = [');
  
  for (const proxy of working.slice(0, 10)) {
    console.log(`  { host: '${proxy.host}', port: ${proxy.port}, protocol: '${proxy.protocol}', country: '${proxy.country}', source: 'Manual' }, // ${proxy.responseTime}ms`);
  }
  
  console.log('];');
  console.log('');
  console.log('═'.repeat(80));
  console.log('');
  
  // Summary table
  console.log('\n📊 Working Proxies Summary:');
  console.log('─'.repeat(80));
  console.log('  #  | Country    | Host              | Port  | Protocol | Speed');
  console.log('─'.repeat(80));
  for (let i = 0; i < Math.min(working.length, 10); i++) {
    const proxy = working[i];
    const num = String(i + 1).padStart(3);
    const country = String(proxy.country).padEnd(10);
    const host = String(proxy.host).padEnd(17);
    const port = String(proxy.port).padEnd(5);
    const protocol = String(proxy.protocol).padEnd(8);
    console.log(`  ${num} | ${country} | ${host} | ${port} | ${protocol} | ${proxy.responseTime}ms`);
  }
  console.log('─'.repeat(80));
  console.log(`\n✅ Top ${Math.min(working.length, 10)} fastest proxies selected for hardcoded list\n`);
}

findWorkingProxies().catch(console.error);
