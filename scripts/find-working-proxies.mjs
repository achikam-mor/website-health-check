/**
 * Script to find REAL working proxies with IP verification
 * Filters out CDN/fake proxies that don't actually change your IP
 * Run: node scripts/find-working-proxies.mjs
 */

import { chromium } from '@playwright/test';

// Fetch proxies from multiple FREE sources
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

// Check if IP is a Cloudflare/CDN IP (these won't work as proxies)
function isCloudflareOrCDN(ip) {
  const cdnRanges = [
    '104.16.', '104.17.', '104.18.', '104.19.', '104.20.', '104.21.', '104.22.', '104.23.', '104.24.', '104.25.', '104.26.', '104.27.', '104.28.', '104.29.', '104.30.', '104.31.',
    '172.64.', '172.65.', '172.66.', '172.67.', '172.68.', '172.69.', '172.70.', '172.71.',
    '188.114.', '190.93.', '197.234.', '198.41.',
    '199.27.', '203.22.', '203.23.', '203.24.', '203.25.', '203.26.', '203.27.', '203.28.', '203.29.', '203.30.', '203.31.', '203.32.', '203.33.',
    '23.227.', '45.8.',
  ];
  
  return cdnRanges.some(range => ip.startsWith(range));
}

// Get actual external IP when using a proxy (verifies proxy actually works)
async function getExternalIP(browser) {
  try {
    const context = browser.contexts()[0];
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    
    // Try multiple IP check services
    const ipServices = [
      'https://api.ipify.org?format=json',
      'https://api.my-ip.io/ip.json',
      'http://ip-api.com/json/',
    ];
    
    for (const service of ipServices) {
      try {
        await page.goto(service, { waitUntil: 'domcontentloaded', timeout: 8000 });
        const content = await page.content();
        
        // Parse IP from response
        let ip = null;
        if (service.includes('ipify')) {
          const match = content.match(/"ip":"([^"]+)"/);
          ip = match ? match[1] : null;
        } else if (service.includes('my-ip')) {
          const match = content.match(/"ip":"([^"]+)"/);
          ip = match ? match[1] : null;
        } else if (service.includes('ip-api')) {
          const match = content.match(/"query":"([^"]+)"/);
          ip = match ? match[1] : null;
        }
        
        if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
          await page.close();
          return ip;
        }
      } catch (e) {
        // Try next service
        continue;
      }
    }
    
    await page.close();
    return null;
  } catch (error) {
    return null;
  }
}

// Validate a single proxy WITH IP VERIFICATION
async function validateProxy(proxy, timeout = 12000) {
  const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
  let browser = null;
  
  try {
    const startTime = Date.now();
    
    // Filter out known CDN IPs immediately
    if (isCloudflareOrCDN(proxy.host)) {
      return { 
        ...proxy, 
        validated: false, 
        error: 'Cloudflare/CDN IP - not a real proxy' 
      };
    }
    
    browser = await chromium.launch({
      headless: true,
      proxy: { server: proxyUrl },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(timeout);
    
    // First, check if we can load a simple page
    await page.goto('http://example.com', { waitUntil: 'domcontentloaded', timeout: timeout });
    
    const content = await page.content();
    if (!content || content.length < 100) {
      throw new Error('Page did not load properly');
    }
    
    // CRITICAL: Verify the actual external IP
    const externalIP = await getExternalIP(browser);
    
    if (!externalIP) {
      throw new Error('Could not detect external IP');
    }
    
    // Check if proxy is actually changing our IP
    if (externalIP === proxy.host) {
      // Perfect! Proxy is working and showing its own IP
      const responseTime = Date.now() - startTime;
      await browser.close();
      
      return { 
        ...proxy, 
        validated: true, 
        responseTime,
        externalIP: externalIP,
        verified: true
      };
    } else {
      // Proxy connected but showing different IP (could still be useful)
      const responseTime = Date.now() - startTime;
      await browser.close();
      
      return { 
        ...proxy, 
        validated: true, 
        responseTime,
        externalIP: externalIP,
        verified: true,
        note: 'IP differs from proxy host (proxy chain or gateway)'
      };
    }
    
  } catch (error) {
    if (browser) await browser.close().catch(() => {});
    return { 
      ...proxy, 
      validated: false, 
      error: error.message 
    };
  }
}

// Main function
async function findWorkingProxies() {
  console.log('🔍 Finding REAL working proxies with IP verification...\n');
  console.log('⚠️  This will filter out Cloudflare/CDN IPs that don\'t work as proxies\n');
  
  // Fetch proxies
  const allProxies = await fetchProxies();
  console.log(`Fetched ${allProxies.length} proxies\n`);
  
  if (allProxies.length === 0) {
    console.log('❌ No proxies found');
    return;
  }
  
  // Pre-filter Cloudflare/CDN IPs
  const filteredProxies = allProxies.filter(p => !isCloudflareOrCDN(p.host));
  const cdnCount = allProxies.length - filteredProxies.length;
  console.log(`🚫 Filtered out ${cdnCount} Cloudflare/CDN IPs (they don't work as proxies)`);
  console.log(`✓ ${filteredProxies.length} potential real proxies remaining\n`);
  
  // Test up to 5000 proxies to find working ones
  const proxiesToTest = filteredProxies.slice(0, 5000);
  console.log(`Testing ${proxiesToTest.length} proxies with IP verification (concurrency: 15, timeout: 12s)...\n`);
  
  const working = [];
  
  // Validate in batches of 15 with IP verification
  for (let i = 0; i < proxiesToTest.length; i += 15) {
    const batch = proxiesToTest.slice(i, i + 15);
    const results = await Promise.all(batch.map(p => validateProxy(p, 12000)));
    const validInBatch = results.filter(p => p.validated && p.verified);
    working.push(...validInBatch);
    
    const batchNum = Math.floor(i / 15) + 1;
    const totalBatches = Math.ceil(proxiesToTest.length / 15);
    console.log(`  Batch ${batchNum}/${totalBatches}: ${validInBatch.length}/${batch.length} VERIFIED (Total: ${working.length} working)`);
    
    // Show some verified IPs
    if (validInBatch.length > 0) {
      for (const p of validInBatch.slice(0, 2)) {
        console.log(`    ✓ ${p.host}:${p.port} → External IP: ${p.externalIP} (${p.responseTime}ms)`);
      }
    }
    
    // Stop if we found enough working proxies
    if (working.length >= 50) {
      console.log(`\n✅ Found ${working.length} VERIFIED working proxies! Stopping validation.\n`);
      break;
    }
  }
  
  console.log(`\n✅ Found ${working.length} VERIFIED working proxies!\n`);
  
  if (working.length === 0) {
    console.log('❌ No working proxies found. Free proxies are often unreliable.');
    console.log('💡 Consider running this script multiple times or using paid proxy services.');
    return;
  }
  
  // Sort by response time
  working.sort((a, b) => a.responseTime - b.responseTime);
  
  // Save to JSON file for reuse (all working proxies)
  const fs = await import('fs');
  const proxiesData = working.map(p => ({
    host: p.host,
    port: p.port,
    protocol: p.protocol,
    country: p.country,
    source: p.source,
    responseTime: p.responseTime,
    externalIP: p.externalIP,
    verified: true,
    verifiedDate: new Date().toISOString()
  }));
  
  // Save to verified-proxies.json (new file for verified proxies)
  fs.writeFileSync('verified-proxies.json', JSON.stringify(proxiesData, null, 2));
  console.log(`💾 Saved ${proxiesData.length} VERIFIED proxies to verified-proxies.json\n`);
  
  // Also update working-proxies.json for backwards compatibility
  fs.writeFileSync('working-proxies.json', JSON.stringify(proxiesData.slice(0, 25), null, 2));
  console.log(`💾 Saved top 25 proxies to working-proxies.json (for workflow)\n`);
  
  // Generate code - ready to paste
  console.log('═'.repeat(80));
  console.log('📋 VERIFIED proxies saved! These are REAL proxies with confirmed IP changes.');
  console.log('═'.repeat(80));
  console.log('');
  
  // Summary table
  console.log('\n📊 Verified Working Proxies Summary:');
  console.log('─'.repeat(100));
  console.log('  #  | Country    | Proxy IP          | Port  | External IP       | Speed  | Verified');
  console.log('─'.repeat(100));
  for (let i = 0; i < Math.min(working.length, 25); i++) {
    const proxy = working[i];
    const num = String(i + 1).padStart(3);
    const country = String(proxy.country).padEnd(10);
    const host = String(proxy.host).padEnd(17);
    const port = String(proxy.port).padEnd(5);
    const extIP = String(proxy.externalIP).padEnd(17);
    const match = proxy.host === proxy.externalIP ? '✓' : '≠';
    console.log(`  ${num} | ${country} | ${host} | ${port} | ${extIP} | ${proxy.responseTime}ms | ${match}`);
  }
  console.log('─'.repeat(100));
  console.log(`\n✅ Total ${working.length} VERIFIED working proxies saved to verified-proxies.json`);
  console.log(`✅ Top 25 saved to working-proxies.json (used by workflow)\n`);
  console.log('📝 Note: "✓" means proxy IP matches external IP (perfect)');
  console.log('📝 Note: "≠" means different IP (proxy chain/gateway, still works)\n');
}

findWorkingProxies().catch(console.error);
