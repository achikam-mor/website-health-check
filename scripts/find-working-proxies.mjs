/**
 * Script to find working proxies and generate hardcoded list
 * Run: node scripts/find-working-proxies.mjs
 */

import { chromium } from '@playwright/test';

// Fetch proxies from multiple sources
async function fetchProxies() {
  const proxies = [];
  
  // Source 1: proxy-list.download
  try {
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
      console.log(`✓ Fetched ${proxies.length} proxies from proxy-list.download`);
    }
  } catch (error) {
    console.error('Error fetching from proxy-list.download:', error.message);
  }
  
  // Source 2: ProxyScrape
  try {
    console.log('Fetching from ProxyScrape...');
    const url = 'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all';
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
            source: 'ProxyScrape'
          });
        }
      }
      console.log(`✓ Fetched ${proxies.length} total proxies (added ProxyScrape)`);
    }
  } catch (error) {
    console.error('Error fetching from ProxyScrape:', error.message);
  }
  
  // Source 3: Geonode (multiple pages)
  try {
    console.log('Fetching from Geonode (pages 1-5)...');
    for (let page = 1; page <= 5; page++) {
      const url = `https://proxylist.geonode.com/api/proxy-list?limit=500&page=${page}&sort_by=lastChecked&sort_type=desc&protocols=http`;
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          for (const proxy of data.data) {
            proxies.push({
              host: proxy.ip,
              port: parseInt(proxy.port),
              protocol: 'http',
              country: proxy.country || 'Unknown',
              source: 'Geonode'
            });
          }
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
    }
    console.log(`✓ Fetched ${proxies.length} total proxies (added Geonode)`);
  } catch (error) {
    console.error('Error fetching from Geonode:', error.message);
  }
  
  // Source 4: Free Proxy List (HTTPS)
  try {
    console.log('Fetching from free-proxy-list (HTTPS)...');
    const url = 'https://www.proxy-list.download/api/v1/get?type=https';
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
            source: 'proxy-list-https'
          });
        }
      }
      console.log(`✓ Fetched ${proxies.length} total proxies (added HTTPS list)`);
    }
  } catch (error) {
    console.error('Error fetching HTTPS list:', error.message);
  }
  
  // Remove duplicates
  const uniqueProxies = Array.from(
    new Map(proxies.map(p => [`${p.host}:${p.port}`, p])).values()
  );
  
  console.log(`✓ Total unique proxies: ${uniqueProxies.length}\n`);
  
  return uniqueProxies;
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
  
  // Test up to 3000 proxies to find working ones
  const proxiesToTest = allProxies.slice(0, 3000);
  console.log(`Testing ${proxiesToTest.length} proxies (concurrency: 20, timeout: 15s)...\n`);
  
  const working = [];
  
  // Validate in batches of 20 with longer timeout
  for (let i = 0; i < proxiesToTest.length; i += 20) {
    const batch = proxiesToTest.slice(i, i + 20);
    const results = await Promise.all(batch.map(p => validateProxy(p, 15000)));
    const validInBatch = results.filter(p => p.validated);
    working.push(...validInBatch);
    console.log(`  Batch ${Math.floor(i / 20) + 1}/${Math.ceil(proxiesToTest.length / 20)}: ${validInBatch.length}/${batch.length} valid (Total: ${working.length} working)`);
    
    // Stop if we found enough working proxies
    if (working.length >= 100) {
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
  console.log('📋 All working proxies have been saved to working-proxies.json');
  console.log('   The workflow will automatically use them.')
  console.log('═'.repeat(80));
  console.log('');
  console.log(`💾 Saved ${working.length} working proxies`);
  console.log('\nTop 20 fastest proxies:');
  console.log('const HARDCODED_PROXIES: ProxyInfo[] = [');
  
  for (const proxy of working.slice(0, 20)) {
    console.log(`  { host: '${proxy.host}', port: ${proxy.port}, protocol: '${proxy.protocol}', country: '${proxy.country}', source: 'Manual' }, // ${proxy.responseTime}ms`);
  }
  
  console.log('];');
  console.log('');
  console.log('═'.repeat(80));
  console.log('');
  
  // Save to JSON file for reuse (all working proxies)
  const fs = await import('fs');
  const proxiesData = working.map(p => ({
    host: p.host,
    port: p.port,
    protocol: p.protocol,
    country: p.country,
    source: 'Manual',
    responseTime: p.responseTime
  }));
  
  fs.writeFileSync('working-proxies.json', JSON.stringify(proxiesData, null, 2));
  console.log(`💾 Saved ${proxiesData.length} working proxies to working-proxies.json\n`);
  
  // Summary table
  console.log('\n📊 Working Proxies Summary (Top 20):');
  console.log('─'.repeat(80));
  console.log('  #  | Country    | Host              | Port  | Protocol | Speed');
  console.log('─'.repeat(80));
  for (let i = 0; i < Math.min(working.length, 20); i++) {
    const proxy = working[i];
    const num = String(i + 1).padStart(3);
    const country = String(proxy.country).padEnd(10);
    const host = String(proxy.host).padEnd(17);
    const port = String(proxy.port).padEnd(5);
    const protocol = String(proxy.protocol).padEnd(8);
    console.log(`  ${num} | ${country} | ${host} | ${port} | ${protocol} | ${proxy.responseTime}ms`);
  }
  console.log('─'.repeat(80));
  console.log(`\n✅ Total ${working.length} working proxies saved to working-proxies.json\n`);
}

findWorkingProxies().catch(console.error);
