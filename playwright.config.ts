import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Run tests with only 1 worker to avoid duplicate UI proxy sessions
  workers: 1,
  
  // Timeout configuration
  timeout: 1080000, // 18 minutes per test
  
  // Retry configuration
  retries: 0, // No retries for health checks
  
  // Reporter
  reporter: 'list',
  
  // Browser settings
  use: {
    // Browser launch settings
    headless: true,
  },
});
