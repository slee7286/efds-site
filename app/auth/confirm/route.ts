import { randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { config, isSupabaseConfigured } from "@/lib/config";
import { EMAIL_FLOW_COOKIE } from "@/lib/auth/email-flow";
import { evaluateUserAccess, provisionAuthenticatedProfile } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const confirmationCookie = "efds-email-confirmation";
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  // Hide the token-bearing path/query while preserving Origin on native form
  // POSTs. no-referrer turns their Origin into "null", failing our CSRF check.
  "Referrer-Policy": "strict-origin",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
};

function redirect(path: string) {
  const response = NextResponse.redirect(new URL(path, config.siteUrl), { status: 303, headers });
  response.cookies.set(confirmationCookie, "", { path: "/auth/confirm", maxAge: 0 });
  response.cookies.delete(EMAIL_FLOW_COOKIE);
  return response;
}

function validToken(token: unknown): token is string {
  return typeof token === "string" && /^[a-zA-Z0-9_-]{20,512}$/.test(token);
}

function escape(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

// Mail security scanners may follow links. Neither HEAD nor GET verifies a token.
export function HEAD() {
  return new NextResponse(null, { headers });
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  if (!isSupabaseConfigured) return redirect("/login?error=auth_unconfigured");
  if (!validToken(token) || (type !== "email" && type !== "recovery" && type !== "email_change")) return redirect("/login?error=auth_link_invalid");

  let flow = type === "recovery" ? "reset" : type === "email_change" ? "email_change" : "magic_link";
  try {
    const next = new URL(url.searchParams.get("next") ?? "/dashboard", config.siteUrl);
    if (type === "email" && next.origin === new URL(config.siteUrl).origin && next.pathname === "/auth/recovery" && next.searchParams.get("flow") === "setup") flow = "setup";
  } catch { /* Unrecognised destinations fall back to the dashboard. */ }

  const nonce = randomBytes(32).toString("hex");
  const title = flow === "email_change" ? "Confirm your email change." : flow === "magic_link" ? "Continue to sign in." : flow === "setup" ? "Set up your password." : "Reset your password.";
  const button = flow === "email_change" ? "Confirm this address" : flow === "magic_link" ? "Continue to sign in" : "Continue to set password";
  const description = flow === "email_change"
    ? "Press Continue to confirm this address. If EFDS also emailed your other address, confirm that link too."
    : "Press Continue to confirm your email and open your EFDS account.";
  // Standalone HTML keeps analytics, scripts and third-party assets away from
  // a page whose URL contains a short-lived credential.
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm your email | EFDS</title><style>
    *{box-sizing:border-box}body{margin:0;background:#f6f5f0;color:#142232;font-family:system-ui,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px}main{width:100%;max-width:480px;background:white;border:1px solid #deded6;border-radius:12px;padding:40px}.brand{font-weight:750;letter-spacing:.12em;color:#21473d}h1{font-size:32px;line-height:1.15;margin:32px 0 16px}p{line-height:1.6;color:#52606b}button{width:100%;padding:16px;border:0;border-radius:6px;background:#173c33;color:white;font:inherit;font-weight:650;cursor:pointer;margin:16px 0}button:focus-visible,a:focus-visible{outline:3px solid #b16c28;outline-offset:4px}a{color:#173c33}small{display:block;margin:18px 0;color:#52606b;line-height:1.5}@media(max-width:420px){main{padding:28px}}
  </style></head><body><main><div class="brand">IMPERIAL EFDS</div><h1>${title}</h1><p>${description}</p><form method="post" action="/auth/confirm"><input type="hidden" name="token_hash" value="${escape(token)}"><input type="hidden" name="type" value="${type}"><input type="hidden" name="flow" value="${flow}"><input type="hidden" name="nonce" value="${nonce}"><button type="submit">${button}</button></form><small>If you did not request this email, close this page.</small><a href="/login">Back to sign in</a></main></body></html>`;
  const response = new NextResponse(html, { headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
  response.cookies.set(confirmationCookie, nonce, { httpOnly: true, secure: new URL(config.siteUrl).protocol === "https:", sameSite: "strict", path: "/auth/confirm", maxAge: 3600 });
  return response;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) return redirect("/login?error=auth_unconfigured");
  if (request.headers.get("origin") !== new URL(config.siteUrl).origin) return new NextResponse("Invalid confirmation request.", { status: 403, headers });
  const form = await request.formData().catch(() => null);
  const token = form?.get("token_hash");
  const type = form?.get("type");
  const flow = form?.get("flow");
  const nonce = form?.get("nonce");
  const expectedNonce = request.cookies.get(confirmationCookie)?.value;
  if (typeof nonce !== "string" || !/^[a-f0-9]{64}$/.test(nonce) || !expectedNonce || !/^[a-f0-9]{64}$/.test(expectedNonce) || !timingSafeEqual(Buffer.from(nonce), Buffer.from(expectedNonce))) return redirect("/login?error=auth_link_invalid");
  if (!validToken(token) || (type !== "email" && type !== "recovery" && type !== "email_change") || (type === "email" && flow !== "magic_link" && flow !== "setup") || (type === "recovery" && flow !== "reset") || (type === "email_change" && flow !== "email_change")) return redirect("/login?error=auth_link_invalid");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: token, type });
  const retryFlow = flow === "setup" ? "setup" : flow === "reset" ? "reset" : flow === "magic_link" ? "magic" : null;
  const retryPath = `/login?error=auth_link_expired${retryFlow ? `&flow=${retryFlow}` : ""}`;
  if (error) {
    // Keep the reason visible in server logs without recording the token,
    // recipient or confirmation URL.
    console.warn("efds_email_confirmation_rejected", {
      flow, code: error.code ?? "unknown", status: error.status ?? null,
    });
    return redirect(retryPath);
  }
  // With secure email change, the first address returns no session or user.
  // It is still confirmed; the second address completes the change.
  if (type === "email_change" && !data.session && !data.user) return redirect("/auth/email-change-pending");
  if (!data.session || !data.user) return redirect(retryPath);
  const profile = await provisionAuthenticatedProfile(data.user, supabase);
  const access = await evaluateUserAccess(data.user, supabase);
  if (!profile || !access.allowed) {
    await supabase.auth.signOut();
    return redirect("/access-denied");
  }
  return redirect(flow === "magic_link" || flow === "email_change" ? "/dashboard" : `/auth/set-password?flow=${flow}`);
}
