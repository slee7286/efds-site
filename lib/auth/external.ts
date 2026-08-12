export function getExternalMagicLinkOptions(siteUrl: string) {
  return { emailRedirectTo: `${siteUrl}/auth/callback` };
}
