/**
 * Script to find working proxies and generate hardcoded list
 * Run: npx ts-node scripts/find-working-proxies.ts
 */

import { fetchAllProxies, getRegionalProxies, ProxyInfo } from '../src/proxy-providers';
import { validateProxies, ValidatedProxy } from '../src/proxy-validator';

async function findWorkingProxies() {
  console.log('🔍 Finding working proxies...\n');
  
  // Fetch proxies
  const allProxies = await fetchAllProxies();
  console.log(`Fetched ${allProxies.length} proxies\n`);
  
  if (allProxies.length === 0) {
    console.log('❌ No proxies found');
    return;
  }
  
  // Get diverse set
  const regionalProxies = getRegionalProxies(allProxies, 3);
  const proxiesToTest = regionalProxies.slice(0, 50); // Test 50 proxies
  
  console.log(`Testing ${proxiesToTest.length} proxies...\n`);
  
  // Validate
  const validated = await validateProxies(proxiesToTest, 15, 10000);
  const working = validated.filter(p => p.validated);
  
  console.log(`\n✅ Found ${working.length} working proxies!\n`);
  
  if (working.length === 0) {
    console.log('No working proxies found. Try running again.');
    return;
  }
  
  // Sort by response time
  working.sort((a, b) => (a.responseTime || 0) - (b.responseTime || 0));
  
  // Generate code
  console.log('Copy and paste this into src/proxy-providers.ts (HARDCODED_PROXIES array):\n');
  console.log('const HARDCODED_PROXIES: ProxyInfo[] = [');
  
  for (const proxy of working.slice(0, 10)) { // Top 10 fastest
    console.log(`  { host: '${proxy.host}', port: ${proxy.port}, protocol: '${proxy.protocol}', country: '${proxy.country}', source: 'Manual' }, // ${proxy.responseTime}ms`);
  }
  
  console.log('];\n');
  
  console.log('\n📋 Full list with details:');
  for (const proxy of working) {
    console.log(`  ${proxy.country.padEnd(10)} ${proxy.host.padEnd(15)}:${String(proxy.port).padEnd(5)} ${proxy.protocol.padEnd(6)} ${proxy.responseTime}ms`);
  }
}

findWorkingProxies().catch(console.error);
