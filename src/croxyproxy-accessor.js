/**
 * CroxyProxy Accessor Module
 * Automates accessing croxyproxy.com and submitting search queries
 */
import { chromium } from '@playwright/test';
export class CroxyProxyAccessor {
    constructor() {
        this.browser = null;
        this.page = null;
    }
    /**
     * Initialize the browser and navigate to croxyproxy.com
     */
    async initialize() {
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
            this.page.on('dialog', async (dialog) => {
                console.log(`  → Dialog detected: ${dialog.type()} - ${dialog.message()}`);
                await dialog.accept();
            });
            await this.page.goto('https://www.croxyproxy.com', {
                waitUntil: 'domcontentloaded',
                timeout: 75000
            });
            // Wait a bit for any dynamic content to load
            await this.simulateDelay(2000, 3000);
            console.log('✓ Browser initialized and ready');
        }
        catch (error) {
            console.error('✗ Failed to initialize browser:', error);
            throw error;
        }
    }
    /**
     * Search for a website through croxyproxy
     * @param url The URL to search for (e.g., "www.stockscanner.net")
     * @returns The URL of the proxied page
     */
    async searchWebsite(url) {
        if (!this.page) {
            throw new Error('Browser not initialized. Call initialize() first.');
        }
        try {
            console.log(`✓ Step 2: Searching for ${url}...`);
            // Find the search input box
            const searchInput = await this.page.locator('input[type="text"], input[name="url"], input[placeholder*="URL"], input[placeholder*="url"], input[placeholder*="address"]').first();
            if (!await searchInput.isVisible()) {
                throw new Error('✗ Search input box not found on croxyproxy.com');
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
            const goButton = await this.page.locator('button:has-text("Go"), button:has-text("GO"), button[type="submit"], input[type="submit"], button:has-text("Browse")').first();
            if (!await goButton.isVisible()) {
                throw new Error('✗ Go button not found on croxyproxy.com');
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
        }
        catch (error) {
            console.error('✗ Failed during website search:', error);
            throw error;
        }
    }
    /**
     * Execute the full workflow: initialize, search, and return result
     * @param url The URL to search for
     * @returns The URL of the proxied page
     */
    async accessSite(url) {
        await this.initialize();
        const resultUrl = await this.searchWebsite(url);
        return resultUrl;
    }
    /**
     * Take a screenshot of the current page
     * @param path Path to save the screenshot
     */
    async takeScreenshot(path) {
        if (!this.page) {
            throw new Error('Browser not initialized.');
        }
        await this.page.screenshot({ path, fullPage: true });
    }
    /**
     * Get the page title
     */
    async getPageTitle() {
        if (!this.page) {
            throw new Error('Browser not initialized.');
        }
        return await this.page.title();
    }
    /**
     * Simulate human-like delay
     */
    async simulateDelay(minMs, maxMs) {
        const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
        await this.page?.waitForTimeout(delay);
    }
    /**
     * Handle Google consent popup specifically
     */
    async handleGoogleConsentPopup() {
        if (!this.page)
            return;
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
                    if (await button.isVisible({ timeout: 5000 })) {
                        console.log('  → Found "Do not consent" button, clicking...');
                        await button.click();
                        clicked = true;
                        console.log('  ✓ Clicked "Do not consent" successfully');
                        // Wait 2-3 seconds after clicking as requested
                        await this.simulateDelay(2000, 3000);
                        break;
                    }
                }
                catch (error) {
                    // Continue trying other selectors
                }
            }
            if (!clicked) {
                console.log('  ℹ No Google consent popup found (this is normal)');
            }
        }
        catch (error) {
            console.log('  ℹ Could not check for consent popup, continuing anyway');
        }
    }
    /**
     * Handle various popups and overlays
     */
    async handlePopups() {
        if (!this.page)
            return;
        try {
            console.log('  → Checking for popups and overlays...');
            // Common popup close button selectors
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
                        // Only close up to 3 popups
                        if (popupsFound >= 3) {
                            console.log('  ✓ Closed 3 popups, stopping');
                            break;
                        }
                    }
                }
                catch (error) {
                    // Continue trying other selectors
                }
            }
            if (popupsFound === 0) {
                console.log('  ℹ No additional popups found');
            }
            else {
                console.log(`  ✓ Closed ${popupsFound} popup(s)`);
            }
        }
        catch (error) {
            console.log('  ℹ Could not check for popups, continuing anyway');
        }
    }
    /**
     * Close the browser
     */
    async close() {
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
    getBrowser() {
        return this.browser;
    }
    /**
     * Get the page instance (for integration with other tools)
     */
    getPage() {
        return this.page;
    }
    /**
     * Navigate to a new URL through the proxy
     * @param url The URL to navigate to
     */
    async navigateTo(url) {
        if (!this.page) {
            throw new Error('Browser not initialized.');
        }
        try {
            console.log(`  → Navigating to: ${url}`);
            await this.page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            await this.simulateDelay(1000, 2000);
            console.log(`  ✓ Navigation complete`);
        }
        catch (error) {
            console.error(`  ✗ Navigation failed: ${error}`);
            throw error;
        }
    }
    /**
     * Check if the page is accessible
     */
    async isPageAccessible() {
        if (!this.page)
            return false;
        try {
            const title = await this.page.title();
            return title.length > 0;
        }
        catch {
            return false;
        }
    }
    /**
     * Get page content for verification
     */
    async getPageContent() {
        if (!this.page) {
            throw new Error('Browser not initialized.');
        }
        return await this.page.content();
    }
    /**
     * Wait for a selector to be visible
     * @param selector CSS selector to wait for
     * @param timeout Maximum time to wait in ms
     */
    async waitForSelector(selector, timeout = 10000) {
        if (!this.page) {
            throw new Error('Browser not initialized.');
        }
        await this.page.locator(selector).first().waitFor({ state: 'visible', timeout });
    }
    /**
     * Click on an element
     * @param selector CSS selector of the element to click
     */
    async clickElement(selector) {
        if (!this.page) {
            throw new Error('Browser not initialized.');
        }
        try {
            console.log(`  → Clicking element: ${selector}`);
            const element = this.page.locator(selector).first();
            await element.waitFor({ state: 'visible', timeout: 5000 });
            await element.click();
            await this.simulateDelay(500, 1000);
            console.log(`  ✓ Clicked successfully`);
        }
        catch (error) {
            console.error(`  ✗ Click failed: ${error}`);
            throw error;
        }
    }
    /**
     * Scroll the page
     * @param distance Distance to scroll in pixels
     */
    async scroll(distance = 500) {
        if (!this.page) {
            throw new Error('Browser not initialized.');
        }
        await this.page.evaluate((dist) => {
            window.scrollBy(0, dist);
        }, distance);
        await this.simulateDelay(300, 700);
    }
    /**
     * Get current URL
     */
    getCurrentUrl() {
        if (!this.page) {
            throw new Error('Browser not initialized.');
        }
        return this.page.url();
    }
    /**
     * Check if an element exists on the page
     * @param selector CSS selector to check
     */
    async elementExists(selector) {
        if (!this.page)
            return false;
        try {
            const count = await this.page.locator(selector).count();
            return count > 0;
        }
        catch {
            return false;
        }
    }
    /**
     * Get text content of an element
     * @param selector CSS selector
     */
    async getTextContent(selector) {
        if (!this.page) {
            throw new Error('Browser not initialized.');
        }
        try {
            const element = this.page.locator(selector).first();
            return await element.textContent();
        }
        catch {
            return null;
        }
    }
}
/**
 * Standalone function to run the CroxyProxy access workflow
 * @param targetUrl The target URL to access through CroxyProxy
 * @returns The CroxyProxyAccessor instance for further interaction
 */
export async function runCroxyProxyAccess(targetUrl = 'www.stockscanner.net') {
    const accessor = new CroxyProxyAccessor();
    try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🌐 Starting CroxyProxy Access Workflow`);
        console.log(`   Target: ${targetUrl}`);
        console.log('='.repeat(60));
        const resultUrl = await accessor.accessSite(targetUrl);
        console.log(`\n${'='.repeat(60)}`);
        console.log(`✓ CroxyProxy Access Complete!`);
        console.log(`   Final URL: ${resultUrl}`);
        console.log(`   Page Title: ${await accessor.getPageTitle()}`);
        console.log(`${'='.repeat(60)}\n`);
        return accessor;
    }
    catch (error) {
        console.error(`\n✗ CroxyProxy Access Failed: ${error}\n`);
        await accessor.close();
        throw error;
    }
}
// Allow running as standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
    runCroxyProxyAccess('www.stockscanner.net')
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
