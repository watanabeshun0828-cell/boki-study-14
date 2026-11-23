import { defineConfig, devices } from '@playwright/test'
const base = process.env.VITE_BASE_PATH || '/boki-study-14/'
const url = process.env.E2E_BASE_URL || 'http://127.0.0.1:4181' + base
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1, timeout: 35000,
  expect: { timeout: 7000 }, reporter: 'list',
  use: { baseURL: url, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium-mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
  webServer: { command: 'npm run preview -- --port 4181 --strictPort', env: { VITE_BASE_PATH: base }, url, reuseExistingServer: false, timeout: 90000 }
})
