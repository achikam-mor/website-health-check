/**
 * Script to shuffle proxies in verified-proxies.json
 * This ensures fair distribution and prevents always using the same proxies
 * Run: node scripts/shuffle-proxies.mjs
 */

import fs from 'fs';
import path from 'path';

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function shuffleProxies() {
  console.log('🔀 Shuffling proxies in verified-proxies.json...\n');
  
  const filePath = path.join(process.cwd(), 'verified-proxies.json');
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error('❌ Error: verified-proxies.json not found');
    process.exit(1);
  }
  
  try {
    // Read the file
    const data = fs.readFileSync(filePath, 'utf8');
    const proxies = JSON.parse(data);
    
    if (!Array.isArray(proxies)) {
      console.error('❌ Error: verified-proxies.json does not contain an array');
      process.exit(1);
    }
    
    console.log(`📊 Found ${proxies.length} proxies`);
    
    if (proxies.length === 0) {
      console.log('⚠️  No proxies to shuffle');
      return;
    }
    
    // Shuffle the array
    const shuffled = shuffleArray(proxies);
    
    // Save back to file
    fs.writeFileSync(filePath, JSON.stringify(shuffled, null, 2));
    
    console.log(`✅ Successfully shuffled ${shuffled.length} proxies`);
    console.log(`📝 Updated verified-proxies.json\n`);
    
    // Show first 5 proxies after shuffle
    console.log('📋 First 5 proxies after shuffle:');
    for (let i = 0; i < Math.min(5, shuffled.length); i++) {
      const p = shuffled[i];
      console.log(`   ${i + 1}. ${p.host}:${p.port} (${p.country}) - ${p.responseTime}ms`);
    }
    
    console.log('\n✅ Shuffle complete!');
    
  } catch (error) {
    console.error('❌ Error shuffling proxies:', error.message);
    process.exit(1);
  }
}

shuffleProxies().catch(console.error);
