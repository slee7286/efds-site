const configuredDomains = process.env.ALLOWED_AUTH_EMAIL_DOMAINS ?? "ic.ac.uk,imperial.ac.uk";
export const CANONICAL_PRODUCTION_SITE_URL = "https://imperial-efds.com";

export function getSiteUrl() {
  if (process.env.NODE_ENV === "production") return CANONICAL_PRODUCTION_SITE_URL;
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4587").replace(/\/$/, "");
}

export const config = {
  siteUrl: getSiteUrl(),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  allowedEmailDomains: configuredDomains.split(",").map((domain) => domain.trim().toLowerCase()).filter(Boolean),
};

export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
