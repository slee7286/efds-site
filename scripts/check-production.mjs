import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const base = process.env.PRODUCTION_URL || "http://127.0.0.1:4588";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const results = { public: [], protected: [], api: [], assets: [] };
try {
  for (const route of ["/", "/about", "/events", "/careers", "/research", "/competitions", "/resources", "/committee", "/sponsors", "/partners", "/contact", "/chat", "/login"]) {
    const response = await page.goto(base + route);
    assert.equal(response.status(), 200, route);
    await page.locator("h1").waitFor();
    assert.equal(await page.locator("main").count(), 1, route);
    results.public.push({ route, status: response.status() });
  }
  for (const route of ["/dashboard", "/dashboard/search", "/dashboard/profile", "/admin", "/admin/documents", "/admin/documents/files", "/admin/slack", "/admin/meetings", "/admin/operations", "/admin/search"]) {
    await page.goto(base + route);
    await page.waitForURL(base + "/access-denied");
    assert.equal(await page.getByRole("note").filter({ hasText: "Local design preview" }).count(), 0);
    results.protected.push({ route, destination: new URL(page.url()).pathname });
  }
  for (const [body, status] of [[{ message: "What is EFDS?", scope: "public" }, 503], [{ message: "", scope: "public" }, 400]]) {
    const response = await page.request.post(base + "/api/chat", { data: body });
    assert.equal(response.status(), status);
    results.api.push({ route: "/api/chat", scope: body.scope, emptyQuestion: !body.message, status });
  }
  const response = await page.request.get(base + "/does-not-exist");
  assert.equal(response.status(), 404);
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base + "/", { waitUntil: "networkidle" });
    await page.evaluate(async () => { for (const img of document.images) img.loading = "eager"; await document.fonts.ready; await Promise.all(Array.from(document.images, img => img.decode())); });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator(".campus-photo-image img").evaluate(img => img.naturalWidth > 0), true);
    results.assets.push({ width, image: await page.locator(".campus-photo-image img").evaluate(img => ({ width: img.naturalWidth, src: new URL(img.currentSrc).pathname })), fonts: await page.evaluate(() => document.fonts.status) });
  }
  await mkdir("artifacts/editorial", { recursive: true });
  await writeFile("artifacts/editorial/production-checks.json", JSON.stringify({ checkedAt: new Date().toISOString(), ...results }, null, 2) + "\n");
  console.log(JSON.stringify({ publicRoutes: results.public.length, protectedRoutes: results.protected.length, apiChecks: results.api.length, responsiveChecks: results.assets.length, notFound: 404 }));
} finally { await browser.close(); }
