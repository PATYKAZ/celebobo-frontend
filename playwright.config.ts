import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout sur la stack locale du backend (même routage nginx qu'en production), chargée avec le
 * jeu de données fixe : `./deploy/local.sh --profile frontend up -d --build` puis `./deploy/local.sh e2e`.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    locale: "fr-FR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // E2E_CHANNEL=msedge (ou chrome) réutilise un navigateur déjà installé en local ; la CI garde le Chromium de Playwright.
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: process.env.E2E_CHANNEL },
    },
  ],
});
