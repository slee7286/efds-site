export type ExternalEmailAuthIntent = "setup" | "reset" | "magic_link";

export function getExternalAuthRedirect(siteUrl: string, intent: ExternalEmailAuthIntent) {
  const path = intent === "magic_link" ? "/auth/callback" : "/auth/recovery";
  const redirect = new URL(path, siteUrl);
  if (intent !== "magic_link") redirect.searchParams.set("flow", intent);
  return redirect.toString();
}

export function getExternalMagicLinkOptions(siteUrl: string) {
  return { emailRedirectTo: getExternalAuthRedirect(siteUrl, "magic_link") };
}
