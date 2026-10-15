import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:5187', browserName: 'chromium', channel: 'chrome' },
  webServer: {
    command: 'npm run dev -- --port 5187 --strictPort',
    url: 'http://127.0.0.1:5187',
    timeout: 30000,
    env: { VITE_CHEMLAB_URL: 'https://example.org/chem', VITE_PHYSICSLAB_URL: '::::' }
  }
});
