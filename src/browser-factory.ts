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
  hardware?: {
    colorDepth: number;
    cpuCores: number;
    deviceMemory: number;
    platform: string;
  };
  referrer?: string;
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
  
  // Set referrer if provided (for first page load)
  if (config.referrer) {
    contextOptions.extraHTTPHeaders = contextOptions.extraHTTPHeaders || {};
    contextOptions.extraHTTPHeaders['Referer'] = config.referrer;
  }
  
  if (config.timezone) {
    contextOptions.timezoneId = config.timezone;
  }
  
  const context = await browser.newContext(contextOptions);
  
  // Override hardware fingerprints if provided (makes each browser unique for GA)
  if (config.hardware) {
    await context.addInitScript((hw) => {
      Object.defineProperty(window.screen, 'colorDepth', { get: () => hw.colorDepth });
      Object.defineProperty(window.screen, 'pixelDepth', { get: () => hw.colorDepth });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => hw.cpuCores });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => hw.deviceMemory });
      Object.defineProperty(navigator, 'platform', { get: () => hw.platform });
    }, config.hardware);
  }
  
  // Override hardware fingerprints if provided
  if (config.hardware) {
    await context.addInitScript((hw) => {
      Object.defineProperty(window.screen, 'colorDepth', { get: () => hw.colorDepth });
      Object.defineProperty(window.screen, 'pixelDepth', { get: () => hw.colorDepth });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => hw.cpuCores });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => hw.deviceMemory });
      Object.defineProperty(navigator, 'platform', { get: () => hw.platform });
    }, config.hardware);
  }
  
  // Set referrer if provided (for first page load)
  if (config.referrer) {
    contextOptions.extraHTTPHeaders = contextOptions.extraHTTPHeaders || {};
    contextOptions.extraHTTPHeaders['Referer'] = config.referrer;
  }
  
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
