import fs from 'fs';

// Proxies to remove based on high failure rates from logs
const problematicProxies = [
  '138.68.60.8:8080',      // 9 page failures
  '185.129.117.221:80',    // 8 page failures
  '12.50.107.217:80',      // 8 page failures
  '200.59.191.233:999',    // 7 failures + browser crash
  '5.180.172.130:80',      // 7 page failures
  '172.238.22.205:80',     // 6 page failures
  '89.116.88.19:80',       // 6 page failures
  '209.97.150.167:8080',   // 6 page failures
];

console.log('🔍 Removing problematic proxies from working-proxies.json...\n');

// Read working-proxies.json
const workingProxies = JSON.parse(fs.readFileSync('working-proxies.json', 'utf8'));
console.log(`📊 Total proxies before cleanup: ${workingProxies.length}`);

// Filter out problematic proxies
const cleanedProxies = workingProxies.filter(proxy => {
  const proxyKey = `${proxy.host}:${proxy.port}`;
  const shouldRemove = problematicProxies.includes(proxyKey);
  
  if (shouldRemove) {
    console.log(`   ❌ Removing: ${proxyKey} (${proxy.country})`);
  }
  
  return !shouldRemove;
});

const removedCount = workingProxies.length - cleanedProxies.length;
console.log(`\n✅ Removed ${removedCount} problematic proxies`);
console.log(`📊 Total proxies after cleanup: ${cleanedProxies.length}\n`);

// Write back to working-proxies.json
fs.writeFileSync('working-proxies.json', JSON.stringify(cleanedProxies, null, 2));
console.log('✅ working-proxies.json updated successfully!\n');

// Also check verified-proxies.json if it exists
if (fs.existsSync('verified-proxies.json')) {
  console.log('🔍 Checking verified-proxies.json...\n');
  const verifiedProxies = JSON.parse(fs.readFileSync('verified-proxies.json', 'utf8'));
  console.log(`📊 Total verified proxies before cleanup: ${verifiedProxies.length}`);
  
  const cleanedVerified = verifiedProxies.filter(proxy => {
    const proxyKey = `${proxy.host}:${proxy.port}`;
    const shouldRemove = problematicProxies.includes(proxyKey);
    
    if (shouldRemove) {
      console.log(`   ❌ Removing: ${proxyKey} (${proxy.country})`);
    }
    
    return !shouldRemove;
  });
  
  const removedVerifiedCount = verifiedProxies.length - cleanedVerified.length;
  console.log(`\n✅ Removed ${removedVerifiedCount} problematic proxies from verified list`);
  console.log(`📊 Total verified proxies after cleanup: ${cleanedVerified.length}\n`);
  
  fs.writeFileSync('verified-proxies.json', JSON.stringify(cleanedVerified, null, 2));
  console.log('✅ verified-proxies.json updated successfully!\n');
}

console.log('✅ Cleanup complete!');
