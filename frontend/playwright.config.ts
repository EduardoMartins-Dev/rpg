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
    // Production build: `next dev`'s on-demand (Turbopack) compilation was causing
    // mid-interaction Fast Refresh remounts that looked like app bugs (elements
    // detaching, dropped state) but were purely a cold-dev-server artifact — see
    // e2e/journey.spec.ts / disciplines.spec.ts / ai-chat.spec.ts history.
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
