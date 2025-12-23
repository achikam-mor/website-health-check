/**
 * Browser Factory Module
 * Creates Playwright browser instances with proxy configuration
 */

import { chromium, Browser, BrowserContext } from '@playwright/test';
import { ValidatedProxy } from './proxy-validator';

export interface BrowserConfig {
  proxy?: ValidatedProxy;
  userAgent?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    name: string;
  };
  viewport?: {
    width: number;
    height: number;
  };
  language?: string;
  timezone?: string;
}

/**
 * Launch a browser with optional proxy configuration
 */
export async function launchBrowserWithProxy(config: BrowserConfig): Promise<{ browser: Browser; context: BrowserContext }> {
  const launchOptions: any = {
    headless: true
  };
  
  // Add proxy configuration if provided
  if (config.proxy) {
    const proxyUrl = `${config.proxy.protocol}://${config.proxy.host}:${config.proxy.port}`;
    launchOptions.proxy = {
      server: proxyUrl
    };
  }
  
  const browser = await chromium.launch(launchOptions);
  
  // Create context with additional configurations
  const contextOptions: any = {};
  
  if (config.userAgent) {
    contextOptions.userAgent = config.userAgent;
  }
  
  if (config.viewport) {
    contextOptions.viewport = config.viewport;
  }
  
  if (config.geolocation) {
    contextOptions.geolocation = {
      latitude: config.geolocation.latitude,
      longitude: config.geolocation.longitude
    };
    contextOptions.permissions = ['geolocation'];
  }
  
  if (config.language) {
    contextOptions.locale = config.language.split(',')[0];
    contextOptions.extraHTTPHeaders = {
      'Accept-Language': config.language
    };
  }
  
  if (config.timezone) {
    contextOptions.timezoneId = config.timezone;
  }
  
  const context = await browser.newContext(contextOptions);
  
  return { browser, context };
}

/**
 * Get location name for proxy (proxy location or geolocation override)
 */
export function getLocationName(config: BrowserConfig): string {
  if (config.geolocation) {
    return config.geolocation.name;
  }
  if (config.proxy) {
    return `${config.proxy.country} (Proxy)`;
  }
  return 'Default Location';
}
