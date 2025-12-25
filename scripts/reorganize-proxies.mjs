import fs from 'fs';
import path from 'path';

const workingProxiesPath = path.join(process.cwd(), 'working-proxies.json');

// Read the current proxies
const proxies = JSON.parse(fs.readFileSync(workingProxiesPath, 'utf-8'));

console.log(`📂 Loaded ${proxies.length} proxies from working-proxies.json`);

// Separate proxies by whether they have a known country
const knownCountryProxies = proxies.filter(p => p.country !== 'Unknown');
const unknownCountryProxies = proxies.filter(p => p.country === 'Unknown');

console.log(`\n🌍 Found ${knownCountryProxies.length} proxies with known countries:`);
knownCountryProxies.forEach(p => {
  console.log(`   - ${p.host}:${p.port} (${p.country}) - ${p.responseTime}ms`);
});

// Sort known country proxies by response time (fastest first)
knownCountryProxies.sort((a, b) => a.responseTime - b.responseTime);

// Sort unknown country proxies by response time (fastest first)
unknownCountryProxies.sort((a, b) => a.responseTime - b.responseTime);

// Combine: known countries first, then unknowns
const sortedProxies = [...knownCountryProxies, ...unknownCountryProxies];

// Take top 25
const top25Proxies = sortedProxies.slice(0, 25);

console.log(`\n✅ Top 25 proxies (prioritized by country, then response time):`);
top25Proxies.forEach((p, i) => {
  console.log(`   ${i + 1}. ${p.host}:${p.port} (${p.country}) - ${p.responseTime}ms`);
});

// Save the reorganized top 25 to the file
fs.writeFileSync(workingProxiesPath, JSON.stringify(top25Proxies, null, 2), 'utf-8');

console.log(`\n💾 Saved top 25 proxies to working-proxies.json`);
console.log(`   - ${knownCountryProxies.length} with known countries`);
console.log(`   - ${25 - knownCountryProxies.length} with fastest response times from unknowns`);
