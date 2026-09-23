export const GOOGLE_AUTH_PROVIDER = "google" as const;

export function getGoogleOAuthOptions(origin: string) {
  const siteOrigin = new URL(origin);
  if (siteOrigin.protocol !== "http:" && siteOrigin.protocol !== "https:") {
    throw new Error("The Google OAuth origin must use HTTP or HTTPS");
  }
  return { redirectTo: `${siteOrigin.origin}/auth/callback` };
}
