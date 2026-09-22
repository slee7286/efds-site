import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  workers: 2,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["json", { outputFile: "artifacts/editorial/browser-results.json" }]],
  use: { baseURL: process.env.PREVIEW_URL ?? "http://127.0.0.1:4587", reducedMotion: "reduce", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: "npm run dev -- --hostname 127.0.0.1", url: "http://127.0.0.1:4587", reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
