export const MICROSOFT_AUTH_PROVIDER = "azure" as const;
// Supabase Auth's Azure provider always supplies `openid` itself. The
// `scopes` option is therefore limited to the additional identity scopes so
// the effective provider request contains each scope exactly once.
export const MICROSOFT_AUTH_SCOPES = "profile email" as const;
export const AUTH_CALLBACK_PATH = "/auth/callback" as const;

export function getMicrosoftOAuthOptions(origin: string) {
  const siteOrigin = new URL(origin);
  if (siteOrigin.protocol !== "http:" && siteOrigin.protocol !== "https:") {
    throw new Error("The Microsoft OAuth origin must use HTTP or HTTPS");
  }

  return {
    scopes: MICROSOFT_AUTH_SCOPES,
    redirectTo: `${siteOrigin.origin}${AUTH_CALLBACK_PATH}`,
  };
}
