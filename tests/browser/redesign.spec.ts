import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const publicRoutes = ["/", "/about", "/events", "/careers", "/research", "/competitions", "/resources", "/committee", "/partners", "/contact", "/chat", "/privacy", "/terms", "/security"];
const workspaceRoutes = ["/dashboard", "/dashboard/search", "/dashboard/slack", "/dashboard/knowledge", "/dashboard/careers", "/dashboard/jobs", "/dashboard/events", "/dashboard/chat", "/dashboard/profile", "/admin", "/admin/search", "/admin/knowledge", "/admin/documents", "/admin/slack", "/admin/meetings", "/admin/operations", "/admin/committee", "/admin/integrations", "/admin/documents/files", "/admin/slack/channels", "/admin/meetings/all", "/admin/operations/actions", "/admin/operations/decisions", "/admin/operations/questions", "/admin/operations/timeline", "/admin/operations/new"];

for (const route of [...publicRoutes, "/login", "/access-denied", ...workspaceRoutes]) {
  test(`${route} renders accessibly within the viewport`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("#main-content")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const links = await page.locator('a[href="#"], a:not([href])').count();
    expect(links).toBe(0);
    expect(errors).toEqual([]);
  });
}

for (const route of ["/", "/about", "/events", "/resources", "/committee", "/contact", "/chat", "/login", "/dashboard", "/admin", "/dashboard/search", "/admin/documents"]) {
  test(`${route} has no WCAG A/AA accessibility violations`, async ({ page }) => {
    await page.goto(route);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(result.violations.map(v => ({ id: v.id, description: v.description, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  });
}

test("public navigation opens, restores focus and follows a destination", async ({ page }, info) => {
  await page.goto("/");
  if (info.project.name === "desktop") {
    await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: "Careers", exact: true }).click();
    await expect(page).toHaveURL(/\/careers$/);
    await expect(page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: "Careers", exact: true })).toHaveAttribute("aria-current", "page");
    return;
  }
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  await trigger.click();
  const menu = page.getByRole("dialog", { name: "Site navigation" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link")).toHaveCount(11);
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await menu.getByRole("link", { name: "Careers", exact: false }).click();
  await expect(page).toHaveURL(/\/careers$/);
  await expect(menu).not.toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("workspace navigation follows the selected route", async ({ page }, info) => {
  await page.goto("/dashboard");
  if (info.project.name !== "desktop") await page.getByRole("button", { name: "Open workspace navigation", exact: true }).click();
  const navigation = info.project.name === "desktop" ? page.getByRole("navigation", { name: "Private navigation" }) : page.getByRole("dialog", { name: "Workspace navigation" }).getByRole("navigation", { name: "Private navigation" });
  await navigation.getByRole("link", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/search$/);
  if (info.project.name !== "desktop") await expect(page.getByRole("dialog", { name: "Workspace navigation" })).not.toBeVisible();
  await expect(page.getByRole("note")).toContainText("Local design preview");
});

test("search preserves its query and gives an honest empty result", async ({ page }) => {
  await page.goto("/dashboard/search");
  await page.locator("#search-query").fill("test question with no results");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=test\+question\+with\+no\+results/);
  await expect(page.locator("#search-query")).toHaveValue("test question with no results");
  await expect(page.getByText("No permitted current sources matched this search.", { exact: true })).toBeVisible();
});

test("Slack archive search keeps its filters and explains empty results", async ({ page }) => {
  await page.goto("/admin/slack/channels");
  await page.getByRole("textbox", { name: "Search message text" }).fill("ACTION-004");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=ACTION-004/);
  await expect(page.getByRole("textbox", { name: "Search message text" })).toHaveValue("ACTION-004");
  await expect(page.getByRole("region", { name: "Archived Slack message results" })).toContainText("No archived messages found");
});

test("committee archive uses committee links and preserves search", async ({ page }) => {
  await page.goto("/dashboard/slack");
  await page.getByRole("textbox", { name: "Search message text" }).fill("ACTION-004");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/slack\?q=ACTION-004/);
  await expect(page.getByRole("textbox", { name: "Search message text" })).toHaveValue("ACTION-004");
  await expect(page.getByRole("region", { name: "Archived Slack message results" })).toContainText("No archived messages found");
  await expect(page.getByRole("navigation", { name: "Slack archive navigation" }).getByRole("link", { name: "Search messages" })).toHaveAttribute("href", "/dashboard/slack");
});

test("an auth code sent to the homepage is routed into the callback", async ({ page }) => {
  await page.goto("/?code=browser-test-code");
  await expect(page).toHaveURL(/\/login\?error=auth_unconfigured$/);
  await expect(page.getByRole("status")).toContainText("Sign-in is unavailable right now");
});

test("unconfigured Microsoft sign-in gives recoverable feedback", async ({ page }) => {
  await page.goto("/login");
  const button = page.getByRole("button", { name: "Continue with Microsoft" });
  await button.click();
  await expect(page.getByRole("status")).toContainText("Sign-in is unavailable in this local preview");
  await expect(button).toBeEnabled();
});

test("approved email flow gives confirmation and a resend cooldown", async ({ page }) => {
  await page.route("**/api/auth/external", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ message: "If this email is eligible for EFDS access, you will receive an email with the next step." }) }));
  await page.goto("/login");
  await page.getByRole("button", { name: /Approved email user/ }).click();
  await page.getByRole("button", { name: "Sign in by email link" }).click();
  await page.getByLabel("Approved email address", { exact: true }).fill("browser-test@example.org");
  await page.getByRole("button", { name: "Send secure email link" }).click();
  await expect(page.getByRole("status")).toContainText("If this email is eligible");
  await expect(page.getByRole("button", { name: /Resend in/ })).toBeDisabled();
});

test("chat retains a failed question and renders a successful streamed citation", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/chat", async route => {
    calls++;
    const body = route.request().postDataJSON();
    expect(body.scope).toBe("public");
    expect(body.source_mode).toBe("preterm_knowledge");
    if (calls === 1) return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Agent service is not configured" }) });
    const events = [{ event: "token", token: "Read the society guidance." }, { event: "citations", citations: [{ id: "source-1", title: "Test guidance", source_type: "knowledge_resource", url: "https://example.org/guidance" }] }, { event: "done", answer: "Read the society guidance." }];
    return route.fulfill({ contentType: "text/event-stream", body: events.map(e => `data: ${JSON.stringify(e)}\n\n`).join("") });
  });
  await page.goto("/chat");
  await expect(page.getByRole("button", { name: "Send question" })).toBeDisabled();
  await page.getByRole("button", { name: "What is EFDS?", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Ask EFDS", exact: true })).toHaveValue("What is EFDS?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByRole("log")).toContainText("The assistant is unavailable right now");
  await expect(page.getByRole("textbox", { name: "Ask EFDS", exact: true })).toHaveValue("What is EFDS?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByRole("log")).toContainText("Read the society guidance.");
  await expect(page.getByRole("link", { name: "EFDS knowledge — Test guidance" })).toHaveAttribute("href", "https://example.org/guidance");
});

test("reduced motion and narrow layouts remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto("/");
  expect(await page.locator(".editorial-hero-copy").evaluate(el => getComputedStyle(el).animationName)).toBe("none");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  const menu = page.getByRole("dialog", { name: "Site navigation" });
  await expect(menu.getByRole("link", { name: "Member access" })).toBeEnabled();
});


test("authentic campus photograph loads with its credit", async ({ page }) => {
  await page.goto("/");
  const art = page.locator(".campus-photo-image img");
  await art.scrollIntoViewIfNeeded();
  await expect(art).toBeVisible();
  await expect.poll(() => art.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator(".campus-photograph figcaption")).toContainText("Shadowssettle");
});

test("advanced search filters persist and stay open after submission", async ({ page }) => {
  await page.goto("/dashboard/search");
  await page.getByText("Refine your search", { exact: true }).click();
  await page.getByLabel("Source area", { exact: true }).fill("events");
  await page.getByLabel("Filter by source", { exact: true }).selectOption("knowledge_process");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/source=knowledge_process/);
  await expect(page.getByLabel("Source area", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Source area", { exact: true })).toHaveValue("events");
});


test("an interrupted chat stream keeps the question available to retry", async ({ page }) => {
  await page.route("**/api/chat", route => route.fulfill({ contentType: "text/event-stream", body: 'data: {"event":"error","error":"Upstream unavailable"}\n\n' }));
  await page.goto("/chat");
  await page.getByRole("textbox", { name: "Ask EFDS", exact: true }).fill("How can I join?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByRole("log")).toContainText("couldn’t complete that answer");
  await expect(page.getByRole("textbox", { name: "Ask EFDS", exact: true })).toHaveValue("How can I join?");
  await expect(page.getByRole("button", { name: "Send question" })).toBeEnabled();
});

test("unknown pages provide a working way home", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found.");
  await page.getByRole("link", { name: "Back to the homepage", exact: false }).click();
  await expect(page).toHaveURL(/\/$/);
});
