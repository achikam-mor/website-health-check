import { test, expect, Page } from '@playwright/test';

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
    
    // Wait for a "reading" pause (between 200ms and 800ms)
    const pause = Math.floor(Math.random() * 600) + 200;
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
    await page.waitForTimeout(200); // Faster scrolling up
  }
}

const pagesToTest = [
  'https://www.stockscanner.net',
  'https://www.stockscanner.net/market-overview.html',
  'https://www.stockscanner.net/hot-stocks.html',
  'https://www.stockscanner.net/watch-list.html',
  'https://www.stockscanner.net/favorites.html' // Note: Ensure this URL is correct (typo check: 'favorites'?)
];

test.describe('StockScanner Health Check', () => {
  for (const url of pagesToTest) {
    test(`Visit and scroll: ${url}`, async ({ page }) => {
      console.log(`Navigating to ${url}...`);
      
      // Increased timeout to 2 mins per test to account for slow scrolling
      test.setTimeout(120000); 

      await page.goto(url, { waitUntil: 'domcontentloaded' });
      
      // Verify basic element exists to confirm page load
      await expect(page.locator('body')).toBeVisible();

      // Perform the scrolling
      await humanScroll(page);
    });
  }
});
