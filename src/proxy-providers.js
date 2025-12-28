/**
 * Proxy Providers Module
 * Fetches free proxy lists from multiple sources with geographic data
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * Load proxies from verified-proxies.json (preferred) or temp-verified-proxies.json (fallback)
 * Falls back to working-proxies.json for backwards compatibility
 */
function loadProxiesFromFile() {
    try {
        // Priority 1: Try verified-proxies.json (from completed find-working-proxies.mjs)
        const verifiedPath = path.join(process.cwd(), 'verified-proxies.json');
        if (fs.existsSync(verifiedPath)) {
            const data = fs.readFileSync(verifiedPath, 'utf8');
            const allProxies = JSON.parse(data);
            // Sort by responseTime (ascending) and take top 50
            const sortedProxies = allProxies
                .filter((p) => p.responseTime)
                .sort((a, b) => a.responseTime - b.responseTime)
                .slice(0, 50);
            console.log(`📂 Loaded top 50 fastest proxies from verified-proxies.json (sorted by response time)`);
            console.log(`   Fastest: ${sortedProxies[0]?.responseTime}ms, Slowest: ${sortedProxies[sortedProxies.length-1]?.responseTime}ms`);
            return sortedProxies;
        }
        // Priority 2: Try temp-verified-proxies.json (temporary file while script is running)
        const tempPath = path.join(process.cwd(), 'temp-verified-proxies.json');
        if (fs.existsSync(tempPath)) {
            const data = fs.readFileSync(tempPath, 'utf8');
            const allProxies = JSON.parse(data);
            // Sort by responseTime (ascending) and take top 50
            const sortedProxies = allProxies
                .filter((p) => p.responseTime)
                .sort((a, b) => a.responseTime - b.responseTime)
                .slice(0, 50);
            console.log(`📂 Loaded top 50 fastest proxies from temp-verified-proxies.json (sorted by response time)`);
            console.log(`   Fastest: ${sortedProxies[0]?.responseTime}ms, Slowest: ${sortedProxies[sortedProxies.length-1]?.responseTime}ms`);
            return sortedProxies;
        }
        // Priority 3: Fall back to working-proxies.json (legacy)
        const legacyPath = path.join(process.cwd(), 'working-proxies.json');
        if (fs.existsSync(legacyPath)) {
            const data = fs.readFileSync(legacyPath, 'utf8');
            const proxies = JSON.parse(data);
            console.log(`📂 Loaded ${proxies.length} proxies from working-proxies.json (legacy file)`);
            return proxies;
        }
        // No proxy files found
        console.log(`❌ No proxy files found. Tried:`);
        console.log(`   1. verified-proxies.json (not found)`);
        console.log(`   2. temp-verified-proxies.json (not found)`);
        console.log(`   3. working-proxies.json (not found)`);
        console.log(`Current working directory: ${process.cwd()}`);
        // List files in current directory for debugging
        try {
            const files = fs.readdirSync(process.cwd());
            console.log(`Files in working directory: ${files.join(', ')}`);
        }
        catch (e) {
            console.log('Could not list directory contents');
        }
        return [];
    }
    catch (error) {
        console.log(`❌ Error loading proxy files: ${error}`);
        return [];
    }
}
const HARDCODED_PROXIES = loadProxiesFromFile();
/**
 * Get hardcoded proxies if available
 */
export function getHardcodedProxies() {
    if (HARDCODED_PROXIES.length > 0) {
        console.log(`📌 Using ${HARDCODED_PROXIES.length} verified proxies (IP-checked, real proxies)`);
        // Log first 5 proxies for verification
        console.log('📍 First 5 proxies to be tested:');
        for (let i = 0; i < Math.min(5, HARDCODED_PROXIES.length); i++) {
            const p = HARDCODED_PROXIES[i];
            console.log(`   ${i + 1}. ${p.host}:${p.port} (${p.country})`);
        }
    }
    return [...HARDCODED_PROXIES];
}
/**
 * Fetch proxies from ProxyScrape API
 * https://api.proxyscrape.com/v2/
 */
async function fetchProxyScrapeProxies() {
    const proxies = [];
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
    }
    catch (error) {
        console.error('Error fetching ProxyScrape proxies:', error);
    }
    return proxies;
}
/**
 * Fetch proxies from PubProxy API
 * http://pubproxy.com/api/proxy
 */
async function fetchPubProxyProxies() {
    const proxies = [];
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
                    }
                    catch (parseError) {
                        // JSON parse error, skip this country
                        continue;
                    }
                }
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            catch (err) {
                // Network error, skip this country
                continue;
            }
        }
    }
    catch (error) {
        console.error('Error fetching PubProxy proxies:', error);
    }
    return proxies;
}
/**
 * Fetch proxies from Geonode API
 * https://proxylist.geonode.com/api/proxy-list
 */
async function fetchGeonodeProxies() {
    const proxies = [];
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
    }
    catch (error) {
        console.error('Error fetching Geonode proxies:', error);
    }
    return proxies;
}
/**
 * Fetch proxies from free-proxy-list.net (scraped list)
 * Note: This is a backup source that provides plain text list
 */
async function fetchFreeProxyListProxies() {
    const proxies = [];
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
    }
    catch (error) {
        console.error('Error fetching free-proxy-list proxies:', error);
    }
    return proxies;
}
/**
 * Fetch proxies from all sources and combine them
 */
export async function fetchAllProxies() {
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
    const uniqueProxies = Array.from(new Map(allProxies.map(p => [`${p.host}:${p.port}`, p])).values());
    console.log(`✅ Fetched ${uniqueProxies.length} unique proxies from ${new Set(uniqueProxies.map(p => p.source)).size} sources`);
    return uniqueProxies;
}
/**
 * Filter proxies by country/region
 */
export function filterProxiesByRegion(proxies, regions) {
    const regionSet = new Set(regions.map(r => r.toUpperCase()));
    return proxies.filter(p => regionSet.has(p.country.toUpperCase()));
}
/**
 * Get diverse proxy set from different regions
 * Priority regions: US, CA, GB, DE, FR, NL, ES
 * If not enough regional proxies, include any available proxies
 */
export function getRegionalProxies(proxies, maxPerRegion = 3) {
    const priorityRegions = ['GB', 'DE', 'FR', 'NL', 'ES', 'IT', 'PL', 'SE', 'CA', 'AU', 'JP', 'SG', 'BR', 'IN'];
    const regionalProxies = [];
    // First pass: Get proxies from priority regions (excluding US)
    for (const region of priorityRegions) {
        const regionProxies = proxies.filter(p => p.country.toUpperCase() === region);
        regionalProxies.push(...regionProxies.slice(0, maxPerRegion));
    }
    // Second pass: If we don't have enough, add any other non-US proxies
    const targetCount = 1000; // Target at least 1000 proxies for validation
    if (regionalProxies.length < targetCount) {
        const remainingProxies = proxies.filter(p => !regionalProxies.find(rp => rp.host === p.host && rp.port === p.port) &&
            p.country.toUpperCase() !== 'US');
        regionalProxies.push(...remainingProxies.slice(0, targetCount - regionalProxies.length));
    }
    return regionalProxies;
}
