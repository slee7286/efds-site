export const MICROSOFT_AUTH_PROVIDER = "azure" as const;
export const MICROSOFT_AUTH_SCOPES = "openid profile email" as const;
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
