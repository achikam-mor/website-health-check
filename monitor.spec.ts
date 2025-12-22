import { test, expect, Page } from '@playwright/test';

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// List of realistic user agents to rotate through
const userAgents = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  // Chrome on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  // Firefox on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  // Firefox on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  // Safari on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  // Edge on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  // Chrome on Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

// Get a random user agent
function getRandomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Function to simulate human-like scrolling
async function humanScroll(page: Page) {
  // 1. Scroll Down
  let currentScroll = 0;
  let scrollHeight = await page.evaluate(() => document.body.scrollHeight);

  while (currentScroll < scrollHeight) {
    // Scroll a random small amount (between 300px and 500px)
    const step = Math.floor(Math.random() * 200) + 300;
    currentScroll += step;
    
    await page.evaluate((y) => window.scrollTo(0, y), currentScroll);
    
    // Recalculate height in case lazy-loading expanded the page
    scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    
    // Wait for a "reading" pause (between 200ms and 1100ms)
    const pause = Math.floor(Math.random() * 800) + 300;
    await page.waitForTimeout(pause);
  }

  // 2. Short pause at the bottom
  await page.waitForTimeout(1000);

  // 3. Scroll Back Up
  while (currentScroll > 0) {
    const step = Math.floor(Math.random() * 200) + 300;
    currentScroll -= step;
    if (currentScroll < 0) currentScroll = 0;

    await page.evaluate((y) => window.scrollTo(0, y), currentScroll);
    await page.waitForTimeout(313); // Faster scrolling up
  }
}

// Base pages (excluding homepage)
const innerPages = [
  'https://www.stockscanner.net/market-overview.html',
  'https://www.stockscanner.net/hot-stocks.html',
  'https://www.stockscanner.net/watch-list.html',
  'https://www.stockscanner.net/favorites.html',
  'https://www.stockscanner.net/filtered-stocks.html',
  'https://www.stockscanner.net/chart-viewer.html',
  'https://www.stockscanner.net/compare.html',
  'https://www.stockscanner.net/export.html'
];

// Build final page list: homepage first, shuffled inner pages, homepage last
const pagesToTest = [
  'https://www.stockscanner.net',
  ...shuffleArray(innerPages),
  'https://www.stockscanner.net'
];

interface PageFailure {
  url: string;
  error: string;
}

test.describe('StockScanner Health Check', () => {
  const failures: PageFailure[] = [];

  for (const url of pagesToTest) {
    test(`Visit and scroll: ${url}`, async ({ page }) => {
      // Set a random user agent for this test
      const userAgent = getRandomUserAgent();
      await page.setExtraHTTPHeaders({ 'User-Agent': userAgent });
      console.log(`Using User-Agent: ${userAgent}`);
      
      console.log(`Navigating to ${url}...`);
      
      // Increased timeout to 2 mins per test to account for slow scrolling
      test.setTimeout(120000); 

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        // Verify basic element exists to confirm page load
        await expect(page.locator('body')).toBeVisible();

        // Perform the scrolling
        await humanScroll(page);
        
        console.log(`✅ Successfully checked: ${url}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Failed to check: ${url} - ${errorMessage}`);
        failures.push({ url, error: errorMessage });
      }
    });
  }

  test.afterAll(() => {
    if (failures.length > 0) {
      console.error('\n========== HEALTH CHECK FAILED ==========');
      console.error(`${failures.length} page(s) failed:\n`);
      
      for (const failure of failures) {
        console.error(`  ❌ ${failure.url}`);
        console.error(`     Reason: ${failure.error}\n`);
      }
      
      console.error('==========================================\n');
      
      // Throw error to mark the overall action as failed
      throw new Error(`Health check failed for ${failures.length} page(s): ${failures.map(f => f.url).join(', ')}`);
    } else {
      console.log('\n========== HEALTH CHECK PASSED ==========');
      console.log('All pages checked successfully!');
      console.log('==========================================\n');
    }
  });
});
