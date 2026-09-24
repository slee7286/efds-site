import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const publicRoutes = ["/", "/about", "/events", "/careers", "/research", "/competitions", "/resources", "/committee", "/sponsors", "/partners", "/contact", "/chat", "/privacy", "/terms", "/security"];
const workspaceRoutes = ["/dashboard", "/dashboard/tickets", "/dashboard/tickets/new", "/dashboard/search", "/dashboard/slack", "/dashboard/knowledge", "/dashboard/careers", "/dashboard/jobs", "/dashboard/events", "/dashboard/chat", "/dashboard/profile", "/admin", "/admin/accounts", "/admin/search", "/admin/knowledge", "/admin/documents", "/admin/slack", "/admin/meetings", "/admin/operations", "/admin/committee", "/admin/integrations", "/admin/documents/files", "/admin/slack/channels", "/admin/meetings/all", "/admin/operations/actions", "/admin/operations/decisions", "/admin/operations/questions", "/admin/operations/timeline", "/admin/operations/new"];

for (const route of [...publicRoutes, "/login", "/signup", "/auth/verify-code?flow=setup", "/access-denied", ...workspaceRoutes]) {
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

for (const route of ["/", "/about", "/events", "/resources", "/committee", "/sponsors", "/contact", "/chat", "/login", "/signup", "/auth/verify-code?flow=setup", "/dashboard", "/dashboard/profile", "/dashboard/tickets", "/admin", "/admin/accounts", "/admin/integrations", "/dashboard/search", "/admin/documents"]) {
  test(`${route} has no WCAG A/AA accessibility violations`, async ({ page }) => {
    await page.goto(route);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(result.violations.map(v => ({ id: v.id, description: v.description, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  });
}

test("public navigation opens, restores focus and follows a destination", async ({ page }, info) => {
  await page.goto("/");
  if (info.project.name === "desktop") {
    await expect(page.locator(".header-login")).toHaveText("Login");
    await expect(page.locator(".header-login")).toHaveAttribute("href", "/login");
  }
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
  await expect(menu.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
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

test("sponsors are visible on the homepage and reachable from navigation", async ({ page }, info) => {
  await page.goto("/");
  const home = page.locator(".sponsor-home");
  await expect(page.locator("main > section").nth(1)).toHaveClass(/sponsor-home/);
  await expect(home).toContainText("Optiver");
  await expect(home).toContainText("Cornerstone Research");
  await expect(home).toContainText("Jane Street");
  if (info.project.name === "desktop") {
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Sponsors" })).toHaveAttribute("href", "/sponsors");
  } else {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("dialog", { name: "Site navigation" }).getByRole("link", { name: "Sponsors" })).toHaveAttribute("href", "/sponsors");
    await page.keyboard.press("Escape");
  }
  await home.getByRole("link", { name: "Meet our sponsors" }).click();
  await expect(page).toHaveURL(/\/sponsors$/);
  await expect(page.locator(".sponsor-group-heading")).toHaveText(["Founding Partner", "Sponsor"]);
  await expect(page.locator(".sponsor-logo-wrap img")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "contact us" })).toHaveAttribute("href", "mailto:siheon.lee25@imperial.ac.uk");
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

test("admin navigation starts with one Society Operations overview", async ({ page }, info) => {
  await page.goto("/admin/accounts");
  if (info.project.name !== "desktop") await page.getByRole("button", { name: "Open workspace navigation", exact: true }).click();
  const sidebar = info.project.name === "desktop" ? page.locator(".app-frame > .app-sidebar") : page.getByRole("dialog", { name: "Workspace navigation" }).locator(".app-sidebar");
  await expect(sidebar.locator(".sidebar-label")).toHaveText(["Society operations", "Your workspace"]);
  const operations = sidebar.getByRole("navigation", { name: "Society operations navigation" });
  await expect(operations.getByRole("link").first()).toHaveText("Overview");
  await expect(operations.getByRole("link", { name: "Overview" })).toHaveAttribute("href", "/dashboard");
  await expect(sidebar.getByRole("navigation", { name: "Private navigation" }).getByRole("link", { name: "Dashboard" })).toHaveCount(0);
});

test("account menu opens the profile and security settings", async ({ page }) => {
  await page.goto("/dashboard");
  await page.locator(".account-trigger").click();
  const accountNavigation = page.getByRole("navigation", { name: "Account navigation" });
  await expect(accountNavigation.getByRole("link", { name: "My profile" })).toHaveAttribute("href", "/dashboard/profile");
  await expect(accountNavigation.getByRole("link", { name: "Account & security" })).toHaveAttribute("href", "/dashboard/profile#account-security");
  await expect(page.getByRole("button", { name: "Sign out unavailable in preview" })).toBeDisabled();
  await accountNavigation.getByRole("link", { name: "My profile" }).click();
  await expect(page).toHaveURL(/\/dashboard\/profile$/);
  await expect(page.getByRole("heading", { name: "Make this account yours." })).toBeVisible();
  await expect(page.getByLabel("Profile photo")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save name" })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
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

test("email sign-in is primary and unavailable Google sign-in cannot be started", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Microsoft" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Google sign-in is being configured" })).toBeDisabled();
});

test("email access options show the selected task and expired setup returns to setup", async ({ page }, info) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await expect(page.getByRole("heading", { name: "Reset your password." })).toBeVisible();
  await page.getByRole("button", { name: "Sign in with password" }).click();
  await page.getByRole("button", { name: "Sign in by email link" }).click();
  await expect(page.getByRole("heading", { name: "Sign in by email link." })).toBeVisible();
  await page.getByRole("button", { name: "Sign in with password" }).click();
  await page.getByRole("button", { name: "First time? Set up password" }).click();
  await expect(page.getByRole("heading", { name: "Set up your password." })).toBeVisible();
  await page.goto("/login?error=auth_link_expired&flow=setup");
  await expect(page.getByRole("heading", { name: "Set up your password." })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("expired or has already been used");
  await page.getByRole("link", { name: "Enter the code" }).click();
  await expect(page).toHaveURL(/\/auth\/verify-code\?flow=setup$/);
  await expect(page.getByRole("heading", { name: "Confirm your email." })).toBeVisible();
  await page.goto("/login?error=auth_link_expired&flow=setup");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `artifacts/editorial/login-setup-${info.project.name}.png`, fullPage: true });
});

test("signup opens a member account flow without an admin approval step", async ({ page }) => {
  await page.route("**/api/auth/external/password-email", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ message: "If this email is eligible for EFDS access, you will receive an email with the next step." }) }));
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Start as a member." })).toBeVisible();
  await page.getByLabel("Email address", { exact: true }).fill("browser-test@imperial.ac.uk");
  await page.getByRole("button", { name: "Email me an account link" }).click();
  await expect(page.getByRole("status")).toContainText("you will receive an email");
  await expect(page.getByRole("button", { name: /Resend in/ })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("tickets preview has a useful empty state and a clearly disabled create form", async ({ page }) => {
  await page.goto("/dashboard/tickets");
  await expect(page.getByText("No tickets have been added yet.")).toBeVisible();
  await page.getByRole("link", { name: "New ticket" }).click();
  await expect(page).toHaveURL(/\/dashboard\/tickets\/new$/);
  await expect(page.getByText("This local preview has no connected workspace, so saving is unavailable.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create ticket" })).toBeDisabled();
});

test("committee ticket suggestion stays editable and cites its Slack source", async ({ page }, info) => {
  await page.route("**/api/tickets/suggest", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({
    answer: "Title: Confirm the autumn venue [S1]\nThe events discussion requests a venue confirmation. [S1]",
    citations: [{ id: "S1", retrievalUnitId: "11111111-1111-4111-8111-111111111111", title: "#events", sourceType: "slack_message", route: "/dashboard/slack/messages/22222222-2222-4222-8222-222222222222", url: null }],
    citedSources: [{ id: "S1", retrievalUnitId: "11111111-1111-4111-8111-111111111111", title: "#events", sourceType: "slack_message", route: "/dashboard/slack/messages/22222222-2222-4222-8222-222222222222", url: null }],
    limitations: [], sourceFocus: "committee", reviewable: true,
  }) }));
  await page.goto("/dashboard/tickets");
  await page.getByRole("button", { name: "Suggest a ticket" }).click();
  await expect(page.getByRole("button", { name: /Publish reviewed ticket/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /#events/ }).first()).toHaveAttribute("href", "/dashboard/slack/messages/22222222-2222-4222-8222-222222222222");
  await page.getByRole("textbox", { name: "Ticket title" }).fill("Confirm the autumn venue and budget");
  await expect(page.getByRole("textbox", { name: "Ticket title" })).toHaveValue("Confirm the autumn venue and budget");
  await expect(page.getByRole("checkbox", { name: /I reviewed the cited Slack message/ })).not.toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(result.violations.map(v => v.id)).toEqual([]);
  await page.screenshot({ path: `artifacts/editorial/ticket-suggestion-${info.project.name}.png`, fullPage: true });
});

test("account review cards contain long claims without horizontal overflow", async ({ page }, info) => {
  await page.goto("/admin/accounts");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    const list = document.querySelector(".account-review-list");
    if (!list) throw new Error("Account review list missing");
    list.innerHTML = `<article class="surface account-review-card"><div class="account-review-identity"><div><span class="eyebrow">imperial account</span><h2>Alex Example</h2><p>alex.with.a.long.student.address@imperial.ac.uk</p></div><div class="account-review-badges"><span class="badge badge-neutral">member</span><span class="badge badge-neutral">pending</span></div></div><div class="account-review-detail"><div><span>Joined</span><strong>23 Sep 2026</strong></div><div><span>Membership claim</span><p>Joined an EFDS careers event and would like access to member resources once the committee confirms my society membership. Reference: AVeryLongUnbrokenMembershipIdentifierThatMustNotBreakMobileLayout.</p></div></div><form class="account-review-form"><label class="form-label">Decision<select class="select"><option>Verify EFDS membership</option></select></label><div class="account-review-actions"><button class="button button-dark" type="button">Save decision</button></div></form></article>`;
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `artifacts/editorial/account-review-preview-${info.project.name}.png`, fullPage: true });
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 760 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("ticket board and activity layout contain long evidence at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto("/dashboard/tickets");
  await expect(page.getByText("No tickets have been added yet.")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    const container = document.querySelector(".ticket-page");
    if (!container) throw new Error("Ticket page missing");
    const stress = document.createElement("section");
    stress.className = "ticket-clusters";
    stress.innerHTML = `<section class="ticket-cluster"><div class="ticket-cluster-heading"><div><span>Workstream</span><h2>Operations and an unusually long committee workstream heading</h2></div><strong>13 tickets</strong></div><div class="ticket-cluster-cards"><a class="ticket-card" href="/dashboard/tickets/new"><span class="ticket-card-top"><span class="ticket-status">In progress</span><span class="ticket-priority">Urgent priority</span></span><strong>ACTION-023 — AVeryLongUnbrokenIdentifierThatWouldUsuallyBreakTheDashboardFormatting</strong><span class="ticket-signal">Slack suggests completed. Review evidence</span><span class="ticket-card-bottom"><span>Siheon, Katia, Alice, Hannah, Teja, Queena, Eesa, Tanuj, Shashwat, Nikodem</span></span></a></div></section>`;
    container.append(stress);
  });
  await expect(page.getByText("ACTION-023 — AVeryLongUnbrokenIdentifierThatWouldUsuallyBreakTheDashboardFormatting")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => {
    const container = document.querySelector(".ticket-page");
    if (!container) throw new Error("Ticket page missing");
    container.innerHTML = `<h1>ACTION-023 — AVeryLongUnbrokenIdentifierThatWouldUsuallyBreakTheDashboardFormatting</h1><section class="ticket-progress-suggestion"><div><h2>Slack suggests completed</h2><p>Katia shared a long update in Slack.</p></div><form><button class="button button-primary">Confirm completed</button></form></section><div class="ticket-detail-grid"><div><section class="surface info-card ticket-description"><h2>What needs to happen</h2><p>https://example.org/aVeryLongUnbrokenIdentifierThatWouldUsuallyBreakTheDashboardFormatting</p></section><section class="surface info-card ticket-activity"><ol class="ticket-activity-list"><li><div class="ticket-activity-marker"></div><div class="ticket-activity-entry"><strong>Katia</strong><p class="ticket-activity-detail">https://example.org/aVeryLongUnbrokenIdentifierThatWouldUsuallyBreakTheDashboardFormatting</p></div></li></ol></section></div><aside><section class="surface info-card ticket-side-form"><h2>People</h2><div class="ticket-assignees"><div><label><input type="checkbox"><span><strong>AVeryLongUnbrokenIdentifierThatWouldUsuallyBreakTheDashboardFormatting</strong></span></label></div></div></section></aside></div>`;
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("approved email flow gives confirmation and a resend cooldown", async ({ page }) => {
  await page.route("**/api/auth/external", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ message: "If this email is eligible for EFDS access, you will receive an email with the next step." }) }));
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in by email link" }).click();
  await page.getByLabel("Email address", { exact: true }).fill("browser-test@example.org");
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
  await expect(menu.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
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
