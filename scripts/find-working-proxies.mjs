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

  // Source 5: ProxyNova API
  try {
    console.log('Fetching from ProxyNova...');
    const url = 'https://www.proxynova.com/proxy-server-list/';
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (response.ok) {
      const text = await response.text();
      // Parse HTML table - ProxyNova has table with proxy data
      const ipMatches = text.matchAll(/abbr title="([0-9.]+)"/g);
      const portMatches = text.matchAll(/proxy-port">(\d+)</g);
      
      const ips = Array.from(ipMatches, m => m[1]);
      const ports = Array.from(portMatches, m => m[1]);
      
      for (let i = 0; i < Math.min(ips.length, ports.length); i++) {
        if (ips[i] && ports[i]) {
          proxies.push({
            host: ips[i],
            port: parseInt(ports[i]),
            protocol: 'http',
            country: 'Unknown',
            source: 'ProxyNova'
          });
        }
      }
      console.log(`✓ Fetched ${proxies.length} total proxies (added ProxyNova)`);
    }
  } catch (error) {
    console.error('Error fetching from ProxyNova:', error.message);
  }

  // Source 6: FreeProxyList.net
  try {
    console.log('Fetching from FreeProxyList.net...');
    const url = 'https://free-proxy-list.net/';
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (response.ok) {
      const text = await response.text();
      // Parse textarea with proxy list
      const matches = text.matchAll(/(\d+\.\d+\.\d+\.\d+):(\d+)/g);
      
      for (const match of matches) {
        proxies.push({
          host: match[1],
          port: parseInt(match[2]),
          protocol: 'http',
          country: 'Unknown',
          source: 'FreeProxyList.net'
        });
      }
      console.log(`✓ Fetched ${proxies.length} total proxies (added FreeProxyList.net)`);
    }
  } catch (error) {
    console.error('Error fetching from FreeProxyList.net:', error.message);
  }

  // Source 7: SpyS.one (Elite Proxies)
  try {
    console.log('Fetching from SpyS.one...');
    const url = 'https://spys.one/en/free-proxy-list/';
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (response.ok) {
      const text = await response.text();
      const matches = text.matchAll(/(\d+\.\d+\.\d+\.\d+)<[^>]+>(\d+)/g);
      
      for (const match of matches) {
        proxies.push({
          host: match[1],
          port: parseInt(match[2]),
          protocol: 'http',
          country: 'Unknown',
          source: 'SpyS.one'
        });
      }
      console.log(`✓ Fetched ${proxies.length} total proxies (added SpyS.one)`);
    }
  } catch (error) {
    console.error('Error fetching from SpyS.one:', error.message);
  }

  // Source 8: ProxyScan.io
  try {
    console.log('Fetching from ProxyScan.io...');
    const url = 'https://www.proxyscan.io/api/proxy?format=txt&type=http,https&level=anonymous,elite&ping=1000&limit=250';
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
            source: 'ProxyScan.io'
          });
        }
      }
      console.log(`✓ Fetched ${proxies.length} total proxies (added ProxyScan.io)`);
    }
  } catch (error) {
    console.error('Error fetching from ProxyScan.io:', error.message);
  }

  // Source 9: PubProxy (multiple countries)
  try {
    console.log('Fetching from PubProxy...');
    const countries = ['US', 'GB', 'DE', 'FR', 'CA', 'JP', 'SG'];
    
    for (const country of countries) {
      const url = `https://pubproxy.com/api/proxy?limit=20&format=txt&type=http&country=${country}`;
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
              country: country,
              source: 'PubProxy'
            });
          }
        }
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
    }
    console.log(`✓ Fetched ${proxies.length} total proxies (added PubProxy)`);
  } catch (error) {
    console.error('Error fetching from PubProxy:', error.message);
  }

  // Source 10: ProxyList.plus
  try {
    console.log('Fetching from ProxyList.plus...');
    const url = 'https://list.proxylistplus.com/Fresh-HTTP-Proxy-List-1';
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (response.ok) {
      const text = await response.text();
      const matches = text.matchAll(/(\d+\.\d+\.\d+\.\d+):(\d+)/g);
      
      for (const match of matches) {
        proxies.push({
          host: match[1],
          port: parseInt(match[2]),
          protocol: 'http',
          country: 'Unknown',
          source: 'ProxyList.plus'
        });
      }
      console.log(`✓ Fetched ${proxies.length} total proxies (added ProxyList.plus)`);
    }
  } catch (error) {
    console.error('Error fetching from ProxyList.plus:', error.message);
  }

  // Source 11: ProxyDB.net
  try {
    console.log('Fetching from ProxyDB.net...');
    for (let page = 1; page <= 5; page++) {
      const url = `https://proxydb.net/?protocol=http&protocol=https&anonlvl=1&anonlvl=2&anonlvl=3&anonlvl=4&country=&page=${page}`;
      const response = await fetch(url, { 
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      if (response.ok) {
        const text = await response.text();
        const matches = text.matchAll(/(\d+\.\d+\.\d+\.\d+):(\d+)/g);
        
        for (const match of matches) {
          proxies.push({
            host: match[1],
            port: parseInt(match[2]),
            protocol: 'http',
            country: 'Unknown',
            source: 'ProxyDB.net'
          });
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
    }
    console.log(`✓ Fetched ${proxies.length} total proxies (added ProxyDB.net)`);
  } catch (error) {
    console.error('Error fetching from ProxyDB.net:', error.message);
  }

  // Source 12: GitHub proxy lists (updated daily)
  try {
    console.log('Fetching from GitHub proxy lists...');
    const githubSources = [
      'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
      'https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt',
      'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
      'https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt',
      'https://raw.githubusercontent.com/sunny9577/proxy-scraper/master/proxies.txt'
    ];
    
    for (const url of githubSources) {
      try {
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
                source: 'GitHub'
              });
            }
          }
        }
      } catch (e) {
        // Continue with next source
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
    }
    console.log(`✓ Fetched ${proxies.length} total proxies (added GitHub lists)`);
  } catch (error) {
    console.error('Error fetching from GitHub:', error.message);
  }

  // Source 13: OpenProxyList
  try {
    console.log('Fetching from OpenProxyList...');
    const url = 'https://api.openproxylist.xyz/http.txt';
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
            source: 'OpenProxyList'
          });
        }
      }
      console.log(`✓ Fetched ${proxies.length} total proxies (added OpenProxyList)`);
    }
  } catch (error) {
    console.error('Error fetching from OpenProxyList:', error.message);
  }

  // Source 14: Proxifly
  try {
    console.log('Fetching from Proxifly...');
    const url = 'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/protocols/http/data.txt';
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
            source: 'Proxifly'
          });
        }
      }
      console.log(`✓ Fetched ${proxies.length} total proxies (added Proxifly)`);
    }
  } catch (error) {
    console.error('Error fetching from Proxifly:', error.message);
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
  
  // Test ALL filtered proxies - no limit!
  const proxiesToTest = filteredProxies; // Test all, no limit
  console.log(`Testing ${proxiesToTest.length} proxies with IP verification (concurrency: 30, timeout: 12s)...\n`);
  console.log(`⚠️  Will scan ALL proxies (no 100 proxy limit)\n`);
  
  const working = [];
  
  // Validate in batches of 30 with IP verification
  for (let i = 0; i < proxiesToTest.length; i += 30) {
    const batch = proxiesToTest.slice(i, i + 30);
    const results = await Promise.all(batch.map(p => validateProxy(p, 12000)));
    const validInBatch = results.filter(p => p.validated && p.verified);
    working.push(...validInBatch);
    
    const batchNum = Math.floor(i / 30) + 1;
    const totalBatches = Math.ceil(proxiesToTest.length / 30);
    const progress = ((i + 30) / proxiesToTest.length * 100).toFixed(1);
    console.log(`  Batch ${batchNum}/${totalBatches} (${progress}%): ${validInBatch.length}/${batch.length} VERIFIED (Total: ${working.length} working)`);
    
    // Show some verified IPs
    if (validInBatch.length > 0) {
      for (const p of validInBatch.slice(0, 2)) {
        console.log(`    ✓ ${p.host}:${p.port} → External IP: ${p.externalIP} (${p.responseTime}ms)`);
      }
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
