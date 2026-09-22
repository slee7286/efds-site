import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4587";
const browser = await chromium.launch();
const page = await browser.newPage();
const pending = ["/", "/admin", "/dashboard"];
const visited = new Set();
const results = [];
try {
  while (pending.length) {
    const route = pending.shift();
    if (visited.has(route)) continue;
    visited.add(route);
    const response = await page.goto(base + route);
    await page.locator("h1").waitFor();
    const links = await page.locator('a[href^="/"]').evaluateAll(nodes => nodes.map(n => n.getAttribute("href")));
    results.push({ route, status: response.status(), links: links.length });
    for (const href of links) {
      const url = new URL(href, base);
      if (url.origin === base && !url.pathname.startsWith("/api/") && !visited.has(url.pathname)) pending.push(url.pathname);
    }
  }
  await writeFile("artifacts/redesign/local-links.json", JSON.stringify(results, null, 2) + "\n");
  const failed = results.filter(r => r.status !== 200);
  console.log(JSON.stringify({ checked: results.length, failed }));
  if (failed.length) process.exitCode = 1;
} finally { await browser.close(); }
