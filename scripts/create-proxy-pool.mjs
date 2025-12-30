import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read verified proxies
const verifiedProxiesPath = path.join(__dirname, '..', 'verified-proxies.json');
const blackListPath = path.join(__dirname, '..', 'BlackListProxies.json');
const outputPath = path.join(__dirname, '..', 'working-proxies.json');

console.log('Reading verified-proxies.json...');
let verifiedProxies = JSON.parse(fs.readFileSync(verifiedProxiesPath, 'utf8'));

// Handle potential git conflict markers
const jsonStr = fs.readFileSync(verifiedProxiesPath, 'utf8');
if (jsonStr.includes('<<<<<<< HEAD') || jsonStr.includes('=======') || jsonStr.includes('>>>>>>>')) {
  console.error('ERROR: verified-proxies.json contains git conflict markers!');
  console.error('Please resolve the git conflicts first.');
  process.exit(1);
}

console.log(`Initial proxy count: ${verifiedProxies.length}`);

console.log('Reading BlackListProxies.json...');
const blackListProxies = JSON.parse(fs.readFileSync(blackListPath, 'utf8'));
console.log(`Blacklist count: ${blackListProxies.length}`);

// Create a set of blacklisted proxy identifiers
const blackListSet = new Set(
  blackListProxies.map(proxy => `${proxy.host}:${proxy.port}`)
);

console.log('\nRemoving blacklisted proxies...');
const filteredProxies = verifiedProxies.filter(proxy => {
  const identifier = `${proxy.host}:${proxy.port}`;
  return !blackListSet.has(identifier);
});

const removedCount = verifiedProxies.length - filteredProxies.length;
console.log(`Removed ${removedCount} blacklisted proxies`);
console.log(`Remaining proxies: ${filteredProxies.length}`);

// Sort by responseTime (ascending - fastest first)
console.log('\nSorting by response time...');
filteredProxies.sort((a, b) => a.responseTime - b.responseTime);

// Take top 100
const top100 = filteredProxies.slice(0, 100);
console.log(`\nTop 100 proxies selected`);

// Get stats
const shortestTime = top100[0]?.responseTime;
const longestTime = top100[top100.length - 1]?.responseTime;

console.log(`\n=== RESPONSE TIME STATS (Top 100) ===`);
console.log(`Shortest response time: ${shortestTime}ms`);
console.log(`Longest response time: ${longestTime}ms`);
console.log(`Average response time: ${Math.round(top100.reduce((sum, p) => sum + p.responseTime, 0) / top100.length)}ms`);

// Save to working-proxies.json
console.log(`\nSaving top 100 proxies to: ${outputPath}`);
fs.writeFileSync(outputPath, JSON.stringify(top100, null, 2));

console.log('\n✓ Proxy pool created successfully!');
console.log(`\nProxy pool location: working-proxies.json`);
console.log(`This file contains the top 100 fastest proxies ready for random selection.`);
