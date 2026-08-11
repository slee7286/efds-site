const configuredDomains = process.env.ALLOWED_AUTH_EMAIL_DOMAINS ?? "ic.ac.uk,imperial.ac.uk";

export const config = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  allowedEmailDomains: configuredDomains.split(",").map((domain) => domain.trim().toLowerCase()).filter(Boolean),
};

export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
