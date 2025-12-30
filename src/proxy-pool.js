import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get a random proxy from the working proxy pool
 * @returns {Object} A random proxy object with host, port, protocol, responseTime, etc.
 */
export function getRandomProxy() {
  const proxyPoolPath = path.join(__dirname, '..', 'working-proxies.json');
  const proxies = JSON.parse(fs.readFileSync(proxyPoolPath, 'utf8'));
  
  if (proxies.length === 0) {
    throw new Error('No proxies available in the pool');
  }
  
  const randomIndex = Math.floor(Math.random() * proxies.length);
  return proxies[randomIndex];
}

/**
 * Get all proxies from the pool
 * @returns {Array} Array of all proxy objects
 */
export function getAllProxies() {
  const proxyPoolPath = path.join(__dirname, '..', 'working-proxies.json');
  return JSON.parse(fs.readFileSync(proxyPoolPath, 'utf8'));
}

/**
 * Get proxy in the format expected by Playwright/browsers
 * @returns {Object} Proxy configuration object
 */
export function getRandomProxyConfig() {
  const proxy = getRandomProxy();
  return {
    server: `${proxy.protocol}://${proxy.host}:${proxy.port}`,
    host: proxy.host,
    port: proxy.port,
    protocol: proxy.protocol
  };
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Random Proxy:');
  console.log(JSON.stringify(getRandomProxy(), null, 2));
  console.log('\nProxy Config for Playwright:');
  console.log(JSON.stringify(getRandomProxyConfig(), null, 2));
}
