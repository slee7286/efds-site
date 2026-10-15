import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const briefPath = "/careers/guide/optiver-3507fe20";

test("reviewed briefs keep sources optional and work with a keyboard", async ({ page }) => {
  const response = await page.goto(briefPath);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Optiver");
  const toggle = page.getByRole("checkbox", { name: "Show sources" });
  const citations = page.locator(".career-guide-source-mark");
  const sources = page.getByRole("region", { name: "Sources", includeHidden: true });
  await expect(toggle).not.toBeChecked();
  await expect(citations.first()).toBeHidden();
  await expect(sources).toBeHidden();
  const findingsBefore = await page.locator("[data-finding-id]").allTextContents();
  expect(findingsBefore).toHaveLength(23);
  const paragraphs = page.locator(".career-guide-paragraph");
  expect(await paragraphs.count()).toBeLessThan(findingsBefore.length);
  await toggle.focus();
  await toggle.press("Space");
  await expect(toggle).toBeChecked();
  await expect(citations.first()).toBeVisible();
  await expect(sources).toBeVisible();
  await expect(citations.first().getByRole("link").first()).toHaveText("[1]");
  await expect(citations.first().getByRole("link").first()).toHaveAttribute("href", /^https?:\/\//);
  const enabledA11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(enabledA11y.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
  await toggle.press("Space");
  await expect(citations.first()).toBeHidden();
  await expect(sources).toBeHidden();
  const findingsAfter = await page.locator("[data-finding-id]").allTextContents();
  expect(findingsAfter).toEqual(findingsBefore);
  const context = page.locator("details.career-guide-context");
  await expect(context).not.toHaveAttribute("open");
  await context.locator("summary").click();
  await expect(context).toHaveAttribute("open", "");
  await expect(context.locator("li")).toHaveCount(findingsBefore.length);
  const disabledA11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(disabledA11y.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("briefs preserve compact reading layout at narrow widths with and without sources", async ({ page }) => {
  await page.goto(briefPath);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    const toggle = page.getByRole("checkbox", { name: "Show sources" });
    for (const enabled of [false, true]) {
      await toggle.setChecked(enabled);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const columns = await page.locator(".career-guide-topic-grid").evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length);
      expect(columns).toBe(width > 780 ? 2 : 1);
    }
  }
});

test("nonfeatured company dossiers remain unavailable anonymously", async ({ page }) => {
  const response = await page.goto("/careers/guide/brevan-howard-6f761511");
  expect(response?.status()).toBe(404);
  await expect(page.locator(".career-guide-detail")).toHaveCount(0);
});
