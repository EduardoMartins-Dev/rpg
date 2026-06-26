import { defineConfig, devices } from "@playwright/test";

// UI E2E ponta a ponta contra front (3000) + back (8080) reais.
// O backend (perfil dev, seed §8) deve estar no ar — ver scripts/e2e.sh.
// O Playwright sobe o frontend automaticamente (webServer abaixo).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
