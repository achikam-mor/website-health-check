/**
 * VPNBook Web Proxy Accessor Module
 * Automates accessing www.vpnbook.com/webproxy and submitting search queries
 */

import { chromium, Browser, Page } from '@playwright/test';

export class VPNBookAccessor {
  private browser: Browser | null = null;
  private page: Page | null = null;

  /**
   * Initialize the browser and navigate to vpnbook.com/webproxy
   */
  async initialize(): Promise<void> {
    try {
      console.log('✓ Step 1: Initializing browser...');
      
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
      });

      this.page = await context.newPage();
      
      // Setup popup handler
      this.page.on('dialog', async dialog => {
        console.log(`  → Dialog detected: ${dialog.type()} - ${dialog.message()}`);
        await dialog.accept();
      });
      
      await this.page.goto('https://www.vpnbook.com/webproxy', { 
        waitUntil: 'domcontentloaded',
        timeout: 120000
      });
      
      // Wait a bit for any dynamic content to load
      await this.simulateDelay(2000, 3000);
      console.log('✓ Browser initialized and ready');
    } catch (error) {
      console.error('✗ Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Search for a website through VPNBook webproxy
   * @param url The URL to search for (e.g., "www.stockscanner.net")
   * @returns The URL of the proxied page
   */
  async searchWebsite(url: string): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    try {
      console.log(`✓ Step 2: Searching for ${url}...`);
      
      // Find the search input box
      const searchInput = await this.page.locator('input[type="text"], input[name="url"], input[placeholder*="URL"], input[placeholder*="url"], input[placeholder*="address"]').first();
      
      if (!await searchInput.isVisible()) {
        throw new Error('✗ Search input box not found on vpnbook.com/webproxy');
      }
      console.log('  → Found search input box');

      // Simulate human typing with delays
      await searchInput.click();
      await this.simulateDelay(300, 500);
      console.log('  → Typing URL...');
      await searchInput.type(url, { delay: 100 });
      await this.simulateDelay(500, 800);
      
      // Find and click the Go button
      console.log('  → Looking for Go button...');
      const goButton = await this.page.locator(
        'button:has-text("Go"), button:has-text("GO"), button[type="submit"], input[type="submit"], button:has-text("Browse"), button:has-text("Surf")'
      ).first();

      if (!await goButton.isVisible()) {
        throw new Error('✗ Go button not found on vpnbook.com/webproxy');
      }
      console.log('  → Found Go button, clicking...');

      // Click the button and wait for navigation
      await Promise.all([
        this.page.waitForLoadState('domcontentloaded', { timeout: 30000 }),
        goButton.click()
      ]);
      
      // Wait for page to settle
      await this.simulateDelay(3000, 4000);
      console.log('✓ Step 3: Navigation complete');

      // Wait for potential popups
      console.log('✓ Step 4: Waiting for potential popups...');
      await this.simulateDelay(2000, 4000);
      
      // Handle Google consent popup specifically
      await this.handleGoogleConsentPopup();
      
      // Handle other potential popups
      await this.handlePopups();
      
      // Wait a bit for the page to settle after popup handling
      await this.simulateDelay(2000, 3000);
      console.log('✓ Step 5: Popups handled, page ready');

      // Return the current URL after navigation
      return this.page.url();
    } catch (error) {
      console.error('✗ Failed during website search:', error);
      throw error;
    }
  }

  /**
   * Execute the full workflow: initialize, search, and return result
   * @param url The URL to search for
   * @returns The URL of the proxied page
   */
  async accessSite(url: string): Promise<string> {
    await this.initialize();
    const resultUrl = await this.searchWebsite(url);
    return resultUrl;
  }

  /**
   * Take a screenshot of the current page
   * @param path Path to save the screenshot
   */
  async takeScreenshot(path: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized.');
    }
    await this.page.screenshot({ path, fullPage: true });
  }

  /**
   * Get the page title
   */
  async getPageTitle(): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not initialized.');
    }
    return await this.page.title();
  }

  /**
   * Simulate human-like delay
   */
  private async simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await this.page?.waitForTimeout(delay);
  }

  /**
   * Handle Google consent popup specifically
   */
  private async handleGoogleConsentPopup(): Promise<void> {
    if (!this.page) return;

    try {
      console.log('  → Checking for Google consent popup...');
      
      const doNotConsentSelectors = [
        'button:has-text("Do not consent")',
        'button:has-text("Do Not Consent")',
        'button:has-text("Reject all")',
        'button:has-text("Reject All")',
        'button[aria-label*="not consent"]',
        'button[aria-label*="reject"]',
        'form[action*="consent"] button:has-text("Do not")',
        '[role="button"]:has-text("Do not consent")'
      ];

      let clicked = false;
      for (const selector of doNotConsentSelectors) {
        try {
          const button = this.page.locator(selector).first();
          if (await button.isVisible({ timeout: 5000 })) {
            console.log('  → Found "Do not consent" button, clicking...');
            await button.click();
            clicked = true;
            console.log('  ✓ Clicked "Do not consent" successfully');
            await this.simulateDelay(2000, 3000);
            break;
          }
        } catch (error) {
          // Continue trying other selectors
        }
      }

      if (!clicked) {
        console.log('  ℹ No Google consent popup found (this is normal)');
      }
    } catch (error) {
      console.log('  ℹ Could not check for consent popup, continuing anyway');
    }
  }

  /**
   * Handle various popups and overlays
   */
  private async handlePopups(): Promise<void> {
    if (!this.page) return;

    try {
      console.log('  → Checking for popups and overlays...');
      
      const popupCloseSelectors = [
        'button[aria-label="Close"]',
        'button[aria-label="close"]',
        'button.close',
        'button[class*="close"]',
        'button[class*="Close"]',
        '[class*="close-button"]',
        '[class*="closeButton"]',
        '[id*="close"]',
        '.modal-close',
        '.popup-close',
        'button:has-text("×")',
        'button:has-text("✕")',
        'button:has-text("Close")',
        '[aria-label*="dismiss"]'
      ];

      let popupsFound = 0;
      for (const selector of popupCloseSelectors) {
        try {
          const closeButton = this.page.locator(selector).first();
          if (await closeButton.isVisible({ timeout: 2500 })) {
            console.log(`  → Found popup close button: ${selector}`);
            await closeButton.click();
            popupsFound++;
            await this.simulateDelay(500, 1000);
            
            if (popupsFound >= 3) {
              console.log('  ✓ Closed 3 popups, stopping');
              break;
            }
          }
        } catch (error) {
          // Continue trying other selectors
        }
      }

      if (popupsFound === 0) {
        console.log('  ℹ No popups found (this is normal)');
      } else {
        console.log(`  ✓ Closed ${popupsFound} popup(s)`);
      }
    } catch (error) {
      console.log('  ℹ Could not check for popups, continuing anyway');
    }
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('✓ Browser closed');
    }
  }

  /**
   * Get the browser instance (for integration with other tools)
   */
  getBrowser(): Browser | null {
    return this.browser;
  }

  /**
   * Get the page instance (for integration with other tools)
   */
  getPage(): Page | null {
    return this.page;
  }
}

/**
 * Standalone function to run the VPNBook access workflow
 * @param targetUrl The target URL to access through VPNBook
 * @returns The VPNBookAccessor instance for further interaction
 */
export async function runVPNBookAccess(targetUrl: string = 'www.stockscanner.net'): Promise<VPNBookAccessor> {
  const accessor = new VPNBookAccessor();
  
  try {
    console.log(`Initializing browser and navigating to vpnbook.com/webproxy...`);
    await accessor.initialize();
    
    console.log(`Searching for: ${targetUrl}`);
    const resultUrl = await accessor.searchWebsite(targetUrl);
    console.log(`Successfully navigated. Result URL: ${resultUrl}`);
    
    const pageTitle = await accessor.getPageTitle();
    console.log(`Page title: ${pageTitle}`);
    
    console.log('Browser remains open for further interactions...');
    return accessor;
  } catch (error) {
    console.error('Error accessing VPNBook:', error);
    await accessor.close();
    throw error;
  }
}
