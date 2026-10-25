import { defineConfig, devices } from '@playwright/test';

// The API serves the built Angular page, so the page and the API share one origin.
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 30_000,
  reporter: 'list',
  use: { baseURL: 'http://localhost:5351', ...devices['Desktop Chrome'] },
  webServer: {
    command: 'dotnet run --project ../Api --no-launch-profile --urls http://localhost:5351',
    url: 'http://localhost:5351/index.html',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
