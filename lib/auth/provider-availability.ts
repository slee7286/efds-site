import "server-only";

import { config, isSupabaseConfigured } from "@/lib/config";

export async function isGoogleSignInAvailable() {
  if (!isSupabaseConfigured) return false;
  try {
    const response = await fetch(`${config.supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: config.supabaseAnonKey },
      next: { revalidate: 300 },
    });
    if (!response.ok) return false;
    const settings = await response.json() as { external?: { google?: boolean } };
    return settings.external?.google === true;
  } catch {
    return false;
  }
}
