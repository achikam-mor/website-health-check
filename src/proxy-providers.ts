/**
 * Proxy Providers Module
 * Fetches free proxy lists from multiple sources with geographic data
 */

export interface ProxyInfo {
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  country: string;
  anonymity?: string;
  source: string;
}

/**
 * HARDCODED WORKING PROXIES
 * Last updated: 2025-12-24 (19 working proxies)
 */
const HARDCODED_PROXIES: ProxyInfo[] = [
  // Original working proxies
  { host: '23.227.60.224', port: 80, protocol: 'http', country: 'CA', source: 'Manual' }, // Toronto, Canada
  { host: '104.16.0.167', port: 80, protocol: 'http', country: 'CA', source: 'Manual' }, // Toronto, Canada
  { host: '185.146.173.210', port: 80, protocol: 'http', country: 'SE', source: 'Manual' }, // Stockholm, Sweden
  { host: '104.25.121.229', port: 80, protocol: 'http', country: 'CA', source: 'Manual' }, // Toronto, Canada
  { host: '104.17.52.129', port: 80, protocol: 'http', country: 'CA', source: 'Manual' }, // Toronto, Canada
  { host: '198.41.218.95', port: 80, protocol: 'http', country: 'US', source: 'Manual' }, // Los Angeles, USA
  { host: '172.67.80.120', port: 80, protocol: 'http', country: 'CA', source: 'Manual' }, // Toronto, Canada
  { host: '104.27.202.46', port: 80, protocol: 'http', country: 'CA', source: 'Manual' }, // Toronto, Canada
  { host: '154.194.12.191', port: 80, protocol: 'http', country: 'SG', source: 'Manual' }, // Singapore
  { host: '185.162.230.248', port: 80, protocol: 'http', country: 'GB', source: 'Manual' }, // Southport, UK
  { host: '185.176.24.226', port: 80, protocol: 'http', country: 'NL', source: 'Manual' }, // Amsterdam, Netherlands
  { host: '104.27.4.65', port: 80, protocol: 'http', country: 'CA', source: 'Manual' }, // Toronto, Canada
  // Verified non-US proxies from 1000-proxy scan (2025-12-24)
  { host: '181.214.1.39', port: 80, protocol: 'http', country: 'DE', source: 'Manual' }, // Frankfurt, Germany
  { host: '206.238.236.115', port: 80, protocol: 'http', country: 'HK', source: 'Manual' }, // Hong Kong
  { host: '185.170.166.107', port: 80, protocol: 'http', country: 'NL', source: 'Manual' }, // Willemstad, Netherlands
  { host: '194.152.44.214', port: 80, protocol: 'http', country: 'UA', source: 'Manual' }, // Kyiv, Ukraine
  { host: '89.116.250.245', port: 80, protocol: 'http', country: 'LT', source: 'Manual' }, // Vilnius, Lithuania
  { host: '185.162.230.178', port: 80, protocol: 'http', country: 'IM', source: 'Manual' }, // Douglas, Isle of Man
  { host: '45.80.110.20', port: 80, protocol: 'http', country: 'EE', source: 'Manual' }, // Tallinn, Estonia
];

/**
 * Get hardcoded proxies if available
 */
export function getHardcodedProxies(): ProxyInfo[] {
  if (HARDCODED_PROXIES.length > 0) {
    console.log(`🔒 Using ${HARDCODED_PROXIES.length} hardcoded proxies`);
  }
  return [...HARDCODED_PROXIES];
}

/**
 * Fetch all proxies from available sources
 */
export async function fetchAllProxies(): Promise<ProxyInfo[]> {
  // Return empty array - hardcoded proxies will be used instead
  return [];
}

/**
 * Get regional proxies (prioritize non-US locations)
 */
export function getRegionalProxies(proxies: ProxyInfo[] = [], perRegion: number = 5): ProxyInfo[] {
  // Return empty array - hardcoded proxies will be used instead
  return [];
}
