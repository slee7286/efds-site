import { expect, test } from "@playwright/test";

test("the moving figure pauses, resumes and responds to the keyboard", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const figure = page.locator(".correlation-study");
  await figure.scrollIntoViewIfNeeded();
  const dot = figure.locator(".study-dots circle").first();
  const initial = await dot.getAttribute("cx");
  await expect.poll(() => dot.getAttribute("cx")).not.toBe(initial);
  await page.getByRole("button", { name: "Pause animation" }).click();
  await expect(figure).toHaveAttribute("data-playing", "false");
  const stopped = await dot.getAttribute("cx");
  // Sample several animation frames: a stopped figure must not drift.
  await page.waitForTimeout(200);
  expect(await dot.getAttribute("cx")).toBe(stopped);
  const slider = page.getByRole("slider", { name: "Correlation", exact: true });
  await slider.focus();
  await slider.press("Home");
  await expect(slider).toHaveValue("-0.95");
  await expect(figure.getByRole("img", { name: /Scatter plot/ })).toHaveAttribute("aria-label", /correlation -0.95/);
  await expect(figure.getByRole("status")).toHaveText("Negative");
  await slider.press("End");
  await expect(slider).toHaveValue("0.95");
  await slider.press("ArrowLeft");
  await expect(slider).toHaveValue("0.9");
  await expect(figure.getByRole("status")).toHaveText("Positive");
  const beforeResume = await dot.getAttribute("cx");
  await page.getByRole("button", { name: "Play animation" }).click();
  await expect.poll(() => dot.getAttribute("cx")).not.toBe(beforeResume);
});

test("reduced motion stays still, and manual exploration still works", async ({ page }) => {
  await page.goto("/research");
  const figure = page.locator(".correlation-study");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveAttribute("data-playing", "false");
  const dot = figure.locator(".study-dots circle").first();
  const initial = await dot.getAttribute("cy");
  await page.waitForTimeout(200);
  expect(await dot.getAttribute("cy")).toBe(initial);
  const slider = figure.getByRole("slider");
  await slider.press("Home");
  for (let i = 0; i < 19; i++) await slider.press("ArrowRight");
  await expect(figure.getByRole("status")).toHaveText("Little linear correlation");
  expect(await dot.getAttribute("cy")).not.toBe(initial);
  await expect(page.getByRole("button", { name: "Play animation" })).toBeVisible();
});

test("the figure stops drawing outside the viewport", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const figure = page.locator(".correlation-study");
  const dot = figure.locator(".study-dots circle").first();
  await figure.scrollIntoViewIfNeeded();
  const moving = await dot.getAttribute("cx");
  await expect.poll(() => dot.getAttribute("cx")).not.toBe(moving);
  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(figure).not.toBeInViewport();
  await page.waitForTimeout(100);
  const offscreen = await dot.getAttribute("cx");
  await page.waitForTimeout(200);
  expect(await dot.getAttribute("cx")).toBe(offscreen);
  await figure.scrollIntoViewIfNeeded();
  await expect.poll(() => dot.getAttribute("cx")).not.toBe(offscreen);
});
