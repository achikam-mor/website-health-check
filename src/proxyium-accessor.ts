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
      
      console.log('  → Navigating to proxyium.com...');
      await this.page.goto('https://www.proxyium.com', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000
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
   * Search for a website through proxyium
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
        throw new Error('✗ Search input box not found on proxyium.com');
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
        'button:has-text("Go"), button:has-text("GO"), button[type="submit"], input[type="submit"], button:has-text("Browse")'
      ).first();

      if (!await goButton.isVisible()) {
        throw new Error('✗ Go button not found on proxyium.com');
      }
      console.log('  → Found Go button, clicking...');

      // Click the button and wait for navigation
      await Promise.all([
        this.page.waitForLoadState('domcontentloaded', { timeout: 60000 }),
        goButton.click()
      ]);
      
      // Wait for page to settle
      await this.simulateDelay(3000, 4000);
      console.log('✓ Step 3: Navigation complete');

      // IMPORTANT: Wait 2-4 seconds for Google consent popup to appear
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
   * Get the browser instance
   */
  getBrowser(): Browser | null {
    return this.browser;
  }

  /**
   * Get the page instance
   */
  getPage(): Page | null {
    return this.page;
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
            console.log('  → Found "Do not consent" button, clicking...');
            await button.click();
            clicked = true;
            console.log('  ✓ Clicked "Do not consent" successfully');
            
            // Wait 2-3 seconds after clicking as requested
            await this.simulateDelay(2000, 3000);
            break;
          }
        } catch (error) {
          // Continue trying other selectors
        }
      }

      if (!clicked) {
        console.log('  → No Google consent popup detected');
      }
    } catch (error) {
      console.log('  → Error handling Google consent popup:', error);
      // Continue execution - popup might not exist
    }
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

    console.log('✓ Starting realistic multi-page browsing simulation...');

    try {
      // Define pages to visit on stockscanner.net
      const pages = [
        '/',
        '/screener',
        '/charts',
        '/watchlist',
        '/portfolio',
        '/news',
        '/market-overview',
        '/scanner',
        '/settings',
        '/help'
      ];

      // Visit 5-10 random pages
      const numPages = Math.floor(Math.random() * 6) + 5; // 5-10 pages
      const shuffledPages = pages.sort(() => Math.random() - 0.5).slice(0, numPages);
      
      console.log(`  → Will visit ${numPages} pages on stockscanner.net`);

      for (let i = 0; i < shuffledPages.length; i++) {
        const pageUrl = shuffledPages[i];
        console.log(`\n  [${i + 1}/${numPages}] Browsing page: ${pageUrl}`);

        try {
          // Navigate to the page
          const currentUrl = this.page.url();
          const baseUrl = new URL(currentUrl).origin;
          await this.page.goto(baseUrl + pageUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
          }).catch(() => {
            console.log(`    → Could not navigate to ${pageUrl}, staying on current page`);
          });

          await this.simulateDelay(1000, 2000);

          // Perform realistic browsing on this page
          await this.browseCurrentPage();

          // Random chance to leave early (10%)
          if (Math.random() < 0.1 && i > 2) {
            console.log(`    → User left after ${i + 1} pages`);
            break;
          }

        } catch (error) {
          console.log(`    → Error on page ${pageUrl}, continuing...`);
        }
      }

      console.log('\n✓ Multi-page browsing simulation complete');
    } catch (error) {
      console.error('✗ Error during browsing simulation:', error);
      throw error;
    }
  }

  /**
   * Perform realistic browsing behavior on the current page
   */
  private async browseCurrentPage(): Promise<void> {
    if (!this.page) return;

    const viewport = this.page.viewportSize() || { width: 1280, height: 720 };

    // Realistic mouse movements (5-10 moves with smooth animation)
    const numMouseMoves = Math.floor(Math.random() * 6) + 5; // 5-10 moves
    for (let i = 0; i < numMouseMoves; i++) {
      const x = Math.floor(Math.random() * viewport.width);
      const y = Math.floor(Math.random() * viewport.height);
      await this.page.mouse.move(x, y, { steps: Math.floor(Math.random() * 5) + 5 });
      await this.simulateDelay(100, 400);
    }

    // Keyboard interactions (30% chance)
    if (Math.random() < 0.3) {
      const keyActions = [
        async () => {
          // Arrow key scrolling
          const numPresses = Math.floor(Math.random() * 3) + 2;
          for (let i = 0; i < numPresses; i++) {
            await this.page!.keyboard.press('ArrowDown');
            await this.simulateDelay(200, 400);
          }
        },
        async () => {
          // Spacebar scroll
          await this.page!.keyboard.press('Space');
          await this.simulateDelay(400, 800);
        },
        async () => {
          // Home/End key
          await this.page!.keyboard.press(Math.random() > 0.5 ? 'Home' : 'End');
          await this.simulateDelay(300, 500);
        }
      ];
      
      const randomAction = keyActions[Math.floor(Math.random() * keyActions.length)];
      try {
        await randomAction();
      } catch (e) {
        // Ignore keyboard errors
      }
    }

    // Hover over links (50% chance)
    if (Math.random() < 0.5) {
      try {
        const links = await this.page.locator('a').count();
        if (links > 0) {
          const randomLink = Math.floor(Math.random() * Math.min(links, 10));
          await this.page.locator('a').nth(randomLink).hover({ timeout: 2000 });
          await this.simulateDelay(200, 500);
        }
      } catch (e) {
        // Ignore hover errors
      }
    }

    // Progressive scrolling down
    const scrollSteps = Math.floor(Math.random() * 5) + 4; // 4-8 scrolls
    for (let i = 0; i < scrollSteps; i++) {
      const scrollAmount = Math.floor(Math.random() * 400) + 200; // 200-600px
      await this.page.evaluate((amount) => {
        window.scrollBy({
          top: amount,
          behavior: 'smooth'
        });
      }, scrollAmount);
      await this.simulateDelay(800, 1800);
    }

    // Random click on non-navigation elements (30% chance)
    if (Math.random() < 0.3) {
      try {
        const selectors = ['button:not([type="submit"])', 'div[role="button"]', '[onclick]'];
        const selector = selectors[Math.floor(Math.random() * selectors.length)];
        const elements = await this.page.locator(selector).count();
        if (elements > 0) {
          const randomEl = Math.floor(Math.random() * Math.min(elements, 5));
          await this.page.locator(selector).nth(randomEl).click({ timeout: 2000, force: true });
          await this.simulateDelay(500, 1000);
        }
      } catch (e) {
        // Element might not be clickable - that's fine
      }
    }

    // Scroll back up (simulate reading something again)
    const scrollUp = Math.floor(Math.random() * 300) + 150;
    await this.page.evaluate((amount) => {
      window.scrollBy({
        top: -amount,
        behavior: 'smooth'
      });
    }, scrollUp);
    await this.simulateDelay(1000, 2000);

    // Random human behaviors (25% chance)
    const randomBehavior = Math.random();
    if (randomBehavior < 0.10) {
      // Reload page (checking for updates)
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
      await this.simulateDelay(1500, 2500);
    } else if (randomBehavior < 0.20) {
      // Extra long pause (user distracted)
      const longPause = Math.floor(Math.random() * 5000) + 3000; // 3-8 seconds
      await this.simulateDelay(longPause, longPause);
    } else if (randomBehavior < 0.25) {
      // Simulate tab unfocus/focus (multitasking)
      await this.page.evaluate(() => {
        window.dispatchEvent(new Event('blur'));
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await this.simulateDelay(2000, 4000);
      await this.page.evaluate(() => {
        window.dispatchEvent(new Event('focus'));
        document.dispatchEvent(new Event('visibilitychange'));
      });
    }

    // Final random mouse movements
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(Math.random() * viewport.width);
      const y = Math.floor(Math.random() * viewport.height);
      await this.page.mouse.move(x, y, { steps: Math.floor(Math.random() * 3) + 3 });
      await this.simulateDelay(200, 500);
    }
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
    await accessor.initialize();
    
    const resultUrl = await accessor.searchWebsite(targetUrl);
    console.log(`  → Result URL: ${resultUrl}`);
    
    const pageTitle = await accessor.getPageTitle();
    console.log(`  → Page title: ${pageTitle}`);
    
    console.log('\n✓ Step 6: Simulating realistic user browsing...');
    await accessor.simulateRealUserBrowsing();
    
    console.log('\n✓ All steps completed successfully');
    console.log('  → Browser remains open for further interactions\n');
    
    // Return accessor so browser stays open
    return accessor;
    
  } catch (error) {
    console.error('\n✗ Error during execution:', error);
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
