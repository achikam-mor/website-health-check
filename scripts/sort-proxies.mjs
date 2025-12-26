/**
 * Utility script to sort proxy files by response time (fastest first)
 * Usage: node scripts/sort-proxies.mjs [filename]
 * Default: node scripts/sort-proxies.mjs (sorts verified-proxies.json)
 */

import fs from 'fs';
import path from 'path';

// Get filename from command line or use default
const filename = process.argv[2] || 'verified-proxies.json';
const filePath = path.resolve(filename);

console.log(`📂 Sorting proxies in: ${filename}\n`);

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`❌ Error: File not found: ${filePath}`);
  console.log('\nUsage: node scripts/sort-proxies.mjs [filename]');
  console.log('Example: node scripts/sort-proxies.mjs verified-proxies.json');
  process.exit(1);
}

try {
  // Read the file
  const data = fs.readFileSync(filePath, 'utf8');
  const proxies = JSON.parse(data);
  
  if (!Array.isArray(proxies)) {
    console.error('❌ Error: File does not contain a valid proxy array');
    process.exit(1);
  }
  
  console.log(`✓ Loaded ${proxies.length} proxies`);
  
  // Sort by response time (fastest first)
  proxies.sort((a, b) => {
    const timeA = a.responseTime || 999999;
    const timeB = b.responseTime || 999999;
    return timeA - timeB;
  });
  
  console.log(`✓ Sorted by response time (fastest first)\n`);
  
  // Save sorted proxies
  fs.writeFileSync(filePath, JSON.stringify(proxies, null, 2));
  console.log(`💾 Saved sorted proxies back to: ${filename}\n`);
  
  // Show top 10
  console.log('📊 Top 10 Fastest Proxies:');
  console.log('─'.repeat(90));
  console.log('  #  | Country    | Host              | Port  | External IP       | Speed');
  console.log('─'.repeat(90));
  
  for (let i = 0; i < Math.min(proxies.length, 10); i++) {
    const proxy = proxies[i];
    const num = String(i + 1).padStart(3);
    const country = String(proxy.country || 'Unknown').padEnd(10);
    const host = String(proxy.host).padEnd(17);
    const port = String(proxy.port).padEnd(5);
    const extIP = String(proxy.externalIP || 'N/A').padEnd(17);
    const speed = proxy.responseTime ? `${proxy.responseTime}ms` : 'N/A';
    console.log(`  ${num} | ${country} | ${host} | ${port} | ${extIP} | ${speed}`);
  }
  
  console.log('─'.repeat(90));
  console.log(`\n✅ Done! ${proxies.length} proxies sorted by speed.\n`);
  
} catch (error) {
  console.error('❌ Error processing file:', error.message);
  process.exit(1);
}
