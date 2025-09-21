import { defineConfig, devices } from '@playwright/test'

/**
 * Production smoke test configuration
 */
export default defineConfig({
  testDir: './tests/e2e/smoke',
  fullyParallel: false,
  forbidOnly: true,
  retries: 3,
  workers: 1,
  reporter: [
    ['json', { outputFile: 'test-results/production-smoke.json' }],
    ['junit', { outputFile: 'test-results/production-smoke.xml' }],
  ],
  use: {
    baseURL: process.env.PRODUCTION_URL,
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Longer timeout for production
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: 'production-smoke',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/*.smoke.spec.ts',
    },
  ],
  timeout: 120000, // 2 minutes per test
})
