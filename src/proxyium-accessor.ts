/**
 * Proxyium Accessor Module
 * Automates accessing proxyium.com and submitting search queries
 */

import { chromium, Browser, Page } from '@playwright/test';

export class ProxyiumAccessor {
  private browser: Browser | null = null;
  private page: Page | null = null;

  /**
   * Initialize the browser and navigate to proxyium.com
   */
  async initialize(): Promise<void> {
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
      console.log(`Dialog detected: ${dialog.type()} - ${dialog.message()}`);
      await dialog.accept();
    });
    
    await this.page.goto('https://www.proxyium.com', { waitUntil: 'networkidle' });
  }

  /**
   * Search for a website through proxyium
   * @param url The URL to search for (e.g., "www.stockscanner.net")
   * @returns The URL of the proxied page
   */
  async searchWebsite(url: string): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    // Find the search input box
    const searchInput = await this.page.locator('input[type="text"], input[name="url"], input[placeholder*="URL"], input[placeholder*="url"], input[placeholder*="address"]').first();
    
    if (!await searchInput.isVisible()) {
      throw new Error('Search input box not found on proxyium.com');
    }

    // Simulate human typing with delays
    await searchInput.click();
    await this.simulateDelay(300, 500);
    await searchInput.type(url, { delay: 100 });
    await this.simulateDelay(500, 800);
    
    // Find and click the Go button
    // Try multiple selectors to find the submit button
    const goButton = await this.page.locator(
      'button:has-text("Go"), button:has-text("GO"), button[type="submit"], input[type="submit"], button:has-text("Browse")'
    ).first();

    if (!await goButton.isVisible()) {
      throw new Error('Go button not found on proxyium.com');
    }

    // Click the button and wait for navigation
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      goButton.click()
    ]);

    // IMPORTANT: Wait 2-4 seconds for Google consent popup to appear
    console.log('Waiting for potential Google consent popup...');
    await this.simulateDelay(2000, 4000);
    
    // Handle Google consent popup specifically
    await this.handleGoogleConsentPopup();
    
    // Handle other potential popups
    await this.handlePopups();
    
    // Wait a bit for the page to settle after popup handling
    await this.simulateDelay(2000, 3000);

    // Return the current URL after navigation
    return this.page.url();
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
   */Google consent popup specifically
   */
  private async handleGoogleConsentPopup(): Promise<void> {
    if (!this.page) return;

    try {
      console.log('Looking for Google consent popup...');
      
      // Multiple selectors to find "Do not consent" button
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
          if (await button.isVisible({ timeout: 1000 })) {
            console.log('Found "Do not consent" button, clicking...');
            await button.click();
            clicked = true;
            console.log('Successfully clicked "Do not consent"');
            
            // Wait 2-3 seconds after clicking as requested
            await this.simulateDelay(2000, 3000);
            break;
          }
        } catch (error) {
          // Continue trying other selectors
        }
      }

      if (!clicked) {
        console.log('No Google consent popup detected or already handled.');
      }
    } catch (error) {
      console.log('Error handling Google consent popup:', error);
      // Continue execution - popup might not exist
    }
  }

  /**
   * Handle 
  private async simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await this.page?.waitForTimeout(delay);
  }

  /**
   * Handle popups and close unwanted dialogs
   */
  private async handlePopups(): Promise<void> {
    if (!this.page) return;

    try {
      // Try to close any visible popups, modals, or overlays
      const popupSelectors = [
        'button:has-text("Close")',
        'button:has-text("X")',
        'button[aria-label="Close"]',
        'button.close',
        '.modal button.close',
        '[class*="close"]',
        '[class*="dismiss"]'
      ];

      for (const selector of popupSelectors) {
        const elements = await this.page.locator(selector).all();
        for (const element of elements) {
          if (await element.isVisible()) {
            await element.click().catch(() => {});
            await this.simulateDelay(300, 500);
          }
        }
      }
    } catch (error) {
      // Ignore errors - popups might not exist
    }
  }

  /**
   * Simulate realistic browsing behavior on the current page
   */
  async simulateRealUserBrowsing(): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized.');
    }

    console.log('Simulating real user browsing behavior...');

    // Random mouse movements
    await this.page.mouse.move(200, 300);
    await this.simulateDelay(500, 1000);
    
    await this.page.mouse.move(600, 400);
    await this.simulateDelay(300, 700);

    // Scroll down slowly like a real user
    const scrollSteps = 3 + Math.floor(Math.random() * 3); // 3-5 scrolls
    for (let i = 0; i < scrollSteps; i++) {
      await this.page.evaluate(() => {
        window.scrollBy(0, 200 + Math.random() * 300);
      });
      await this.simulateDelay(800, 1500);
    }

    // Move mouse around
    await this.page.mouse.move(400, 500);
    await this.simulateDelay(500, 1000);

    // Scroll back up a bit
    await this.page.evaluate(() => {
      window.scrollBy(0, -150);
    });
    await this.simulateDelay(1000, 1500);

    console.log('Browsing simulation complete.');
  }

  /**
   * Get the current page instance for custom interactions
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * Get the browser instance
   */
  getBrowser(): Browser | null {
    return this.browser;
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

// Example usage function for testing or standalone execution
export async function runProxyiumAccess(targetUrl: string = 'www.stockscanner.net'): Promise<ProxyiumAccessor> {
  const accessor = new ProxyiumAccessor();
  
  try {
    console.log(`Initializing browser and navigating to proxyium.com...`);
    await accessor.initialize();
    
    console.log(`Searching for: ${targetUrl}`);
    const resultUrl = await accessor.searchWebsite(targetUrl);
    
    console.log(`Successfully navigated. Result URL: ${resultUrl}`);
    
    const pageTitle = await accessor.getPageTitle();
    console.log(`Page title: ${pageTitle}`);
    
    // Simulate real user browsing behavior
    await accessor.simulateRealUserBrowsing();
    
    // Optional: Take a screenshot for verification
    // await accessor.takeScreenshot('stockscanner-result.png');
    
    console.log('Browser remains open for further interactions...');
    
    // Return accessor so browser stays open
    return accessor;
    
  } catch (error) {
    console.error('Error accessing proxyium:', error);
    await accessor.close();
    throw error;
  }
}

// Allow running as standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
  runProxyiumAccess('www.stockscanner.net')
    .then((accessor) => {
      console.log('Done! Browser is still open.');
      console.log('You can now interact with the page or call accessor.close() when done.');
      // Keep the process alive for a while to inspect
      setTimeout(async () => {
        console.log('Closing browser after 30 seconds...');
        await accessor.close();
        console.log('Browser closed.');
      }, 30000);
    })
    .catch(error => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
