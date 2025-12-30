import fs from 'fs';

const files = [
  'BlackListProxies.json',
  'verified-proxies.json', 
  'temp-verified-proxies.json',
  'working-proxies.json'
];

console.log('\n=== PROXY FILES ANALYSIS ===\n');

files.forEach(f => {
  try {
    const data = JSON.parse(fs.readFileSync(f, 'utf8'));
    console.log(`📄 ${f}`);
    console.log(`   Proxies: ${data.length}`);
    console.log(`   File size: ${(fs.statSync(f).size / 1024).toFixed(2)} KB`);
    console.log();
  } catch(e) {
    console.log(`📄 ${f}: ERROR - ${e.message}\n`);
  }
});
