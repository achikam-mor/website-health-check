import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const verifiedProxiesPath = path.join(__dirname, '..', 'verified-proxies.json');

console.log('Reading verified-proxies.json with conflicts...');
const content = fs.readFileSync(verifiedProxiesPath, 'utf8');

// Remove git conflict markers and keep HEAD version
let cleaned = content
  .split('\n')
  .filter(line => {
    const trimmed = line.trim();
    // Skip conflict markers and content after =======
    return !trimmed.startsWith('<<<<<<<') && 
           !trimmed.startsWith('=======') && 
           !trimmed.startsWith('>>>>>>>');
  });

// Reconstruct by keeping only HEAD content (before =======)
let inConflict = false;
let result = [];

for (const line of content.split('\n')) {
  const trimmed = line.trim();
  
  if (trimmed.startsWith('<<<<<<<')) {
    inConflict = true;
    continue;
  }
  
  if (trimmed.startsWith('=======')) {
    inConflict = 'skip';
    continue;
  }
  
  if (trimmed.startsWith('>>>>>>>')) {
    inConflict = false;
    continue;
  }
  
  if (inConflict !== 'skip') {
    result.push(line);
  }
}

const cleanedContent = result.join('\n');

// Try to parse it to make sure it's valid JSON
try {
  const parsed = JSON.parse(cleanedContent);
  console.log(`Successfully parsed ${parsed.length} proxies`);
  
  // Write back the cleaned version
  fs.writeFileSync(verifiedProxiesPath, JSON.stringify(parsed, null, 2));
  console.log('✓ Conflicts resolved and file saved');
} catch (err) {
  console.error('Failed to parse cleaned JSON:', err.message);
  console.error('Saving cleaned content anyway...');
  fs.writeFileSync(verifiedProxiesPath, cleanedContent);
}
