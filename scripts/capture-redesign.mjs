import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:4587";
const destination = "artifacts/editorial";
await mkdir(destination, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const routes = [
  ["home-desktop", 1440, 1000, "/"], ["home-mobile", 390, 844, "/"], ["home-tablet", 768, 1024, "/"],
  ["about-desktop", 1440, 1000, "/about"], ["events-desktop", 1440, 1000, "/events"],
  ["careers-desktop", 1440, 1000, "/careers"], ["research-desktop", 1440, 1000, "/research"],
  ["committee-desktop", 1440, 1000, "/committee"], ["resources-mobile", 390, 844, "/resources"],
  ["login-desktop", 1440, 1000, "/login"], ["login-mobile", 390, 844, "/login"],
  ["chat-desktop", 1440, 1000, "/chat"], ["dashboard-desktop", 1440, 1000, "/dashboard"],
  ["dashboard-mobile", 390, 844, "/dashboard"], ["admin-desktop", 1440, 1000, "/admin"],
  ["admin-mobile", 390, 844, "/admin"], ["search-mobile", 390, 844, "/dashboard/search"],
  ["documents-desktop", 1440, 1000, "/admin/documents"], ["documents-mobile", 390, 844, "/admin/documents/files"],
  ["search-filters-mobile", 390, 844, "/admin/search?q=events&source=knowledge_process&area=events"],
  ["operations-form-mobile", 390, 844, "/admin/operations/new"],
  ["sponsors-desktop", 1440, 1000, "/sponsors"], ["sponsors-mobile", 390, 844, "/sponsors"],
  ["competitions-mobile", 390, 844, "/competitions"],
  ["research-mobile", 390, 844, "/research"], ["contact-desktop", 1440, 1000, "/contact"],
  ["home-narrow", 320, 760, "/"],
];
const results = [];
try {
  for (const [name, width, height, route] of routes) {
    const page = await browser.newPage({ reducedMotion: "reduce", viewport: { width, height } });
    page.on("pageerror", error => errors.push(error.message));
    const response = await page.goto(base + route, { waitUntil: "networkidle" });
    if (response.status() !== 200) throw new Error(`${route}: HTTP ${response.status()}`);
    await page.evaluate(async () => {
      for (const img of document.images) img.loading = "eager";
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, img => img.decode()));
    });
    await page.screenshot({ path: `${destination}/${name}.png`, fullPage: true });
    const result = { name, route, width, status: response.status(), overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), title: await page.title() };
    results.push(result);
    console.log(JSON.stringify(result));
    await page.close();
  }
  await writeFile(`${destination}/screenshots.json`, JSON.stringify({ capturedAt: new Date().toISOString(), results, errors }, null, 2) + "\n");
  if (errors.length || results.some(r => r.overflow)) throw new Error(JSON.stringify({ errors, overflow: results.filter(r => r.overflow) }));
} finally { await browser.close(); }
