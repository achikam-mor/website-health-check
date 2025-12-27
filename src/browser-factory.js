// Browser Factory Module - Launches browsers with proxy and proxyium support
import { chromium } from '@playwright/test';
import { ProxyiumAccessor } from './proxyium-accessor';
import { CroxyProxyAccessor } from './croxyproxy-accessor';
/**
 * Launch browser with proxy configuration
 * Includes comprehensive error handling and logging
 */
export async function launchBrowserWithProxy(config) {
    try {
        const proxyServer = config.proxy
            ? `${config.proxy.protocol}://${config.proxy.host}:${config.proxy.port}`
            : undefined;
        // Log proxy attempt
        if (config.proxy) {
            console.log(`🔄 Attempting proxy: [${config.proxy.country || 'Unknown'}] ${config.proxy.host}:${config.proxy.port}`);
        }
        const browser = await chromium.launch({
            headless: true,
            proxy: proxyServer ? { server: proxyServer } : undefined,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const contextOptions = {
            userAgent: config.userAgent,
            viewport: config.viewport,
            geolocation: config.geolocation ? {
                latitude: config.geolocation.latitude,
                longitude: config.geolocation.longitude
            } : undefined,
            permissions: config.geolocation ? ['geolocation'] : [],
            locale: config.language?.split(',')[0] || 'en-US',
            timezoneId: config.timezone || 'America/New_York',
            extraHTTPHeaders: {
                'Accept-Language': config.language || 'en-US,en;q=0.9'
            }
        };
        // Add referrer if provided
        if (config.referrer) {
            contextOptions.extraHTTPHeaders['Referer'] = config.referrer;
        }
        const context = await browser.newContext(contextOptions);
        // Log success
        if (config.proxy) {
            console.log(`✓ Proxy successful: [${config.proxy.country || 'Unknown'}] ${config.proxy.host}:${config.proxy.port} - Response time: ${config.proxy.responseTime || 'N/A'}ms`);
        }
        else {
            console.log(`✓ Direct connection established (no proxy)`);
        }
        return { browser, context };
    }
    catch (error) {
        // Log failure
        if (config.proxy) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`✗ Proxy failed: [${config.proxy.country || 'Unknown'}] ${config.proxy.host}:${config.proxy.port} - Error: ${errorMsg}`);
        }
        throw error;
    }
}
/**
 * Launch browser with Proxyium web proxy
 * Handles proxyium-specific popup closing, then returns browser ready for standard behavior
 */
export async function launchBrowserWithProxyium(config) {
    try {
        console.log(`🔄 Attempting Proxyium web proxy...`);
        const proxyiumAccessor = new ProxyiumAccessor();
        await proxyiumAccessor.initialize();
        // Navigate to target site through proxyium
        await proxyiumAccessor.searchWebsite('www.stockscanner.net');
        // Get the browser and page from proxyium accessor
        const browser = proxyiumAccessor.getBrowser();
        const page = proxyiumAccessor.getPage();
        if (!browser || !page) {
            throw new Error('Failed to get browser or page from Proxyium');
        }
        // Get the context from the page
        const context = page.context();
        console.log(`✓ Proxyium successful: Web proxy established`);
        return { browser, context };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`✗ Proxyium failed: ${errorMsg}`);
        throw error;
    }
}
/**
 * Launch browser with CroxyProxy web proxy
 * Handles croxyproxy-specific popup closing, then returns browser ready for standard behavior
 */
export async function launchBrowserWithCroxyProxy(config) {
    try {
        console.log(`🔄 Attempting CroxyProxy web proxy...`);
        const croxyProxyAccessor = new CroxyProxyAccessor();
        await croxyProxyAccessor.initialize();
        // Navigate to target site through croxyproxy
        await croxyProxyAccessor.searchWebsite('www.stockscanner.net');
        // Get the browser and page from croxyproxy accessor
        const browser = croxyProxyAccessor.getBrowser();
        const page = croxyProxyAccessor.getPage();
        if (!browser || !page) {
            throw new Error('Failed to get browser or page from CroxyProxy');
        }
        // Get the context from the page
        const context = page.context();
        console.log(`✓ CroxyProxy successful: Web proxy established`);
        return { browser, context };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`✗ CroxyProxy failed: ${errorMsg}`);
        throw error;
    }
}
/**
 * Get location name from proxy info
 */
export function getLocationName(proxy) {
    if (!proxy)
        return 'Direct (No Proxy)';
    return `${proxy.country || 'Unknown'} - ${proxy.host}`;
}
