import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: process.env.EDULAB_HOME_TEST_OUTPUT_DIR || 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:5187',
    browserName: 'chromium',
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run dev -- --port 5187 --strictPort',
    url: 'http://127.0.0.1:5187',
    timeout: 30000,
    reuseExistingServer: process.env.EDULAB_HOME_REUSE_SERVER === 'true',
    // Test-only overrides exercise the configured-link and invalid-URL UI states.
    env: { VITE_CHEMLAB_URL: 'https://example.org/chem', VITE_PHYSICSLAB_URL: '::::' }
  }
});
