import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  // Se prueba el sitio exportado tal y como se publica: HTML estático sin servidor de Next.
  webServer: {
    command: `npm run build && npx serve out -l ${PORT} --no-request-logging`,
    url: `http://localhost:${PORT}/es`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
