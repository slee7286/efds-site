import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const destination = "artifacts/editorial";
await mkdir(destination, { recursive: true });
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "no-preference", recordVideo: { dir: "/tmp/efds-motion-captures", size: { width: 1440, height: 1000 } } });
  const page = await context.newPage();
  await page.goto((process.env.PREVIEW_URL || "http://127.0.0.1:4587") + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2200);
  const slider = page.getByRole("slider", { name: "Correlation", exact: true });
  const bounds = await slider.boundingBox();
  await page.mouse.move(bounds.x + bounds.width * .835, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * .13, bounds.y + bounds.height / 2, { steps: 48 });
  await page.mouse.up();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${destination}/home-negative-correlation.png` });
  await slider.press("End");
  await page.waitForTimeout(1600);
  await page.getByRole("button", { name: "Pause animation" }).click();
  await page.waitForTimeout(1000);
  const video = page.video();
  await context.close();
  await video.saveAs(`${destination}/correlation-motion.webm`);
  console.log(`${destination}/correlation-motion.webm`);
} finally { await browser.close(); }
