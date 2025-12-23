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
 * Fetch proxies from ProxyScrape API
 * https://api.proxyscrape.com/v2/
 */
async function fetchProxyScrapeProxies(): Promise<ProxyInfo[]> {
  const proxies: ProxyInfo[] = [];
  
  try {
    // Fetch HTTP proxies
    const httpUrl = 'https://api.proxyscrape.com/v2/?request=get&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all&format=json';
    const httpResponse = await fetch(httpUrl);
    
    if (httpResponse.ok) {
      const httpData = await httpResponse.json();
      if (Array.isArray(httpData.proxies)) {
        for (const proxy of httpData.proxies) {
          proxies.push({
            host: proxy.ip || proxy.host,
            port: parseInt(proxy.port),
            protocol: proxy.protocol === 'https' ? 'https' : 'http',
            country: proxy.country || 'Unknown',
            anonymity: proxy.anonymity,
            source: 'ProxyScrape'
          });
        }
      }
    }
    
    // Fetch SOCKS5 proxies
    const socksUrl = 'https://api.proxyscrape.com/v2/?request=get&protocol=socks5&timeout=10000&country=all&format=json';
    const socksResponse = await fetch(socksUrl);
    
    if (socksResponse.ok) {
      const socksData = await socksResponse.json();
      if (Array.isArray(socksData.proxies)) {
        for (const proxy of socksData.proxies) {
          proxies.push({
            host: proxy.ip || proxy.host,
            port: parseInt(proxy.port),
            protocol: 'socks5',
            country: proxy.country || 'Unknown',
            anonymity: proxy.anonymity,
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
          const data = await response.json();
          
          if (data.data && Array.isArray(data.data)) {
            for (const proxy of data.data) {
              const [host, portStr] = proxy.ipPort.split(':');
              proxies.push({
                host,
                port: parseInt(portStr),
                protocol: proxy.type === 'socks5' ? 'socks5' : 'http',
                country: proxy.country,
                anonymity: proxy.support?.includes('anonymous') ? 'anonymous' : 'transparent',
                source: 'PubProxy'
              });
            }
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Error fetching PubProxy for ${country}:`, err);
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
 */
export function getRegionalProxies(proxies: ProxyInfo[], maxPerRegion: number = 3): ProxyInfo[] {
  const priorityRegions = ['US', 'CA', 'GB', 'DE', 'FR', 'NL', 'ES'];
  const regionalProxies: ProxyInfo[] = [];
  
  for (const region of priorityRegions) {
    const regionProxies = proxies.filter(p => p.country.toUpperCase() === region);
    regionalProxies.push(...regionProxies.slice(0, maxPerRegion));
  }
  
  return regionalProxies;
}
