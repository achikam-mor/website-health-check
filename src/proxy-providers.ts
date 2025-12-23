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
 * Update this list with proxies you've verified to be working.
 * To find working proxies, run the test once, check the logs for validated proxies,
 * and add them here.
 * 
 * Format: { host: 'IP', port: PORT, protocol: 'http', country: 'COUNTRY', source: 'Manual' }
 */
const HARDCODED_PROXIES: ProxyInfo[] = [
  // Example (replace with actual working proxies):
  // { host: '123.45.67.89', port: 8080, protocol: 'http', country: 'US', source: 'Manual' },
  // { host: '98.76.54.32', port: 3128, protocol: 'http', country: 'GB', source: 'Manual' },
  // { host: '111.22.33.44', port: 80, protocol: 'http', country: 'DE', source: 'Manual' },
];

/**
 * Get hardcoded proxies if available
 */
export function getHardcodedProxies(): ProxyInfo[] {
  if (HARDCODED_PROXIES.length > 0) {
    console.log(`📌 Using ${HARDCODED_PROXIES.length} hardcoded proxies`);
  }
  return [...HARDCODED_PROXIES];
}

/**
 * Fetch proxies from ProxyScrape API
 * https://api.proxyscrape.com/v2/
 */
async function fetchProxyScrapeProxies(): Promise<ProxyInfo[]> {
  const proxies: ProxyInfo[] = [];
  
  try {
    // Fetch HTTP proxies in text format (more reliable than JSON)
    const httpUrl = 'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all';
    const httpResponse = await fetch(httpUrl);
    
    if (httpResponse.ok) {
      const text = await httpResponse.text();
      const lines = text.trim().split('\n');
      
      for (const line of lines) {
        const [host, portStr] = line.trim().split(':');
        if (host && portStr && !isNaN(parseInt(portStr))) {
          proxies.push({
            host,
            port: parseInt(portStr),
            protocol: 'http',
            country: 'Unknown',
            source: 'ProxyScrape'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching ProxyScrape proxies:', error);
  }
  
  return proxies;
}

/**
 * Fetch proxies from PubProxy API
 * http://pubproxy.com/api/proxy
 */
async function fetchPubProxyProxies(): Promise<ProxyInfo[]> {
  const proxies: ProxyInfo[] = [];
  const countries = ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'ES', 'IT'];
  
  try {
    for (const country of countries) {
      // Fetch up to 5 proxies per country
      const url = `http://pubproxy.com/api/proxy?limit=5&format=json&type=http&country=${country}`;
      
      try {
        const response = await fetch(url);
        if (response.ok) {
          const text = await response.text();
          
          // Check if response is "No proxy" or other error message
          if (text === 'No proxy' || text.startsWith('No proxy')) {
            // Skip this country, no proxies available
            continue;
          }
          
          try {
            const data = JSON.parse(text);
            
            if (data.data && Array.isArray(data.data)) {
              for (const proxy of data.data) {
                const [host, portStr] = proxy.ipPort.split(':');
                proxies.push({
                  host,
                  port: parseInt(portStr),
                  protocol: proxy.type === 'socks5' ? 'socks5' : 'http',
                  country: proxy.country,
                  anonymity: (Array.isArray(proxy.support) && proxy.support.includes('anonymous')) ? 'anonymous' : 'transparent',
                  source: 'PubProxy'
                });
              }
            }
          } catch (parseError) {
            // JSON parse error, skip this country
            continue;
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        // Network error, skip this country
        continue;
      }
    }
  } catch (error) {
    console.error('Error fetching PubProxy proxies:', error);
  }
  
  return proxies;
}

/**
 * Fetch proxies from Geonode API
 * https://proxylist.geonode.com/api/proxy-list
 */
async function fetchGeonodeProxies(): Promise<ProxyInfo[]> {
  const proxies: ProxyInfo[] = [];
  
  try {
    const url = 'https://proxylist.geonode.com/api/proxy-list?limit=100&page=1&sort_by=lastChecked&sort_type=desc&protocols=http%2Chttps%2Csocks5';
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        for (const proxy of data.data) {
          // Only take proxies that were checked recently (last 24 hours)
          const lastChecked = new Date(proxy.lastChecked);
          const hoursSinceCheck = (Date.now() - lastChecked.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceCheck < 24) {
            proxies.push({
              host: proxy.ip,
              port: parseInt(proxy.port),
              protocol: proxy.protocols[0] || 'http',
              country: proxy.country,
              anonymity: proxy.anonymityLevel,
              source: 'Geonode'
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching Geonode proxies:', error);
  }
  
  return proxies;
}

/**
 * Fetch proxies from free-proxy-list.net (scraped list)
 * Note: This is a backup source that provides plain text list
 */
async function fetchFreeProxyListProxies(): Promise<ProxyInfo[]> {
  const proxies: ProxyInfo[] = [];
  
  try {
    // This endpoint provides a simple text list
    const url = 'https://www.proxy-list.download/api/v1/get?type=http';
    const response = await fetch(url);
    
    if (response.ok) {
      const text = await response.text();
      const lines = text.trim().split('\n');
      
      for (const line of lines) {
        const [host, portStr] = line.trim().split(':');
        if (host && portStr) {
          proxies.push({
            host,
            port: parseInt(portStr),
            protocol: 'http',
            country: 'Unknown',
            source: 'proxy-list.download'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching free-proxy-list proxies:', error);
  }
  
  return proxies;
}

/**
 * Fetch proxies from all sources and combine them
 */
export async function fetchAllProxies(): Promise<ProxyInfo[]> {
  console.log('🔍 Fetching proxies from multiple sources...');
  
  const [proxyScrape, pubProxy, geonode, freeProxyList] = await Promise.all([
    fetchProxyScrapeProxies(),
    fetchPubProxyProxies(),
    fetchGeonodeProxies(),
    fetchFreeProxyListProxies()
  ]);
  
  const allProxies = [
    ...proxyScrape,
    ...pubProxy,
    ...geonode,
    ...freeProxyList
  ];
  
  // Remove duplicates based on host:port
  const uniqueProxies = Array.from(
    new Map(allProxies.map(p => [`${p.host}:${p.port}`, p])).values()
  );
  
  console.log(`✅ Fetched ${uniqueProxies.length} unique proxies from ${new Set(uniqueProxies.map(p => p.source)).size} sources`);
  
  return uniqueProxies;
}

/**
 * Filter proxies by country/region
 */
export function filterProxiesByRegion(proxies: ProxyInfo[], regions: string[]): ProxyInfo[] {
  const regionSet = new Set(regions.map(r => r.toUpperCase()));
  return proxies.filter(p => regionSet.has(p.country.toUpperCase()));
}

/**
 * Get diverse proxy set from different regions
 * Priority regions: US, CA, GB, DE, FR, NL, ES
 * If not enough regional proxies, include any available proxies
 */
export function getRegionalProxies(proxies: ProxyInfo[], maxPerRegion: number = 3): ProxyInfo[] {
  const priorityRegions = ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'ES'];
  const regionalProxies: ProxyInfo[] = [];
  
  // First pass: Get proxies from priority regions
  for (const region of priorityRegions) {
    const regionProxies = proxies.filter(p => p.country.toUpperCase() === region);
    regionalProxies.push(...regionProxies.slice(0, maxPerRegion));
  }
  
  // Second pass: If we don't have enough, add any other proxies
  const targetCount = 30; // Target at least 30 proxies for validation
  if (regionalProxies.length < targetCount) {
    const remainingProxies = proxies.filter(p => 
      !regionalProxies.find(rp => rp.host === p.host && rp.port === p.port)
    );
    regionalProxies.push(...remainingProxies.slice(0, targetCount - regionalProxies.length));
  }
  
  return regionalProxies;
}
